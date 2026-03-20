"""
Scanner service: ingests content items, scores them against all keywords,
and creates or updates flags — respecting suppression rules.

Suppression rule:
  If a flag was previously marked 'irrelevant', it will NOT be re-surfaced
  (i.e., reset to 'pending') unless the content item's last_updated timestamp
  has changed since the flag was last evaluated (content_snapshot_ts).

  This means a reviewer's irrelevant decision is sticky until the content itself
  changes, at which point the flag is treated as new and reset to pending.
"""

from datetime import datetime, timezone

from django.utils.dateparse import parse_datetime

from monitor.models import ContentItem, Flag, Keyword
from monitor.services.content import get_content


def compute_score(keyword_name: str, title: str, body: str) -> int:
    """
    Deterministic scoring:
      100 - exact keyword match in title (case-insensitive, whole word boundary not required
            but the full keyword phrase must appear as a substring)
       70 - partial match in title (any word in a multi-word keyword appears in title)
       40 - keyword appears only in body
        0 - no match
    """
    kw = keyword_name.lower()
    title_lower = title.lower()
    body_lower = body.lower()

    if kw in title_lower:
        # Check if it's an exact phrase match vs partial
        # For single-word keywords, exact == partial, so always 100.
        # For multi-word keywords, exact phrase in title = 100.
        return 100

    # Partial: any individual word of the keyword appears in the title
    kw_words = kw.split()
    if len(kw_words) > 1 and any(word in title_lower for word in kw_words):
        return 70

    if kw in body_lower:
        return 40

    # Partial word match in body (any word of multi-word keyword)
    if len(kw_words) > 1 and any(word in body_lower for word in kw_words):
        return 40

    return 0


def _parse_ts(ts_value) -> datetime:
    """Normalize a timestamp string or datetime to an aware datetime."""
    if isinstance(ts_value, datetime):
        if ts_value.tzinfo is None:
            return ts_value.replace(tzinfo=timezone.utc)
        return ts_value
    parsed = parse_datetime(str(ts_value))
    if parsed is None:
        raise ValueError(f"Cannot parse timestamp: {ts_value}")
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def upsert_content_item(item_data: dict) -> tuple[ContentItem, bool]:
    """
    Insert or update a ContentItem. Returns (instance, content_changed).
    content_changed is True if the item already existed and last_updated advanced.
    """
    last_updated = _parse_ts(item_data["last_updated"])

    obj, created = ContentItem.objects.get_or_create(
        title=item_data["title"],
        source=item_data["source"],
        defaults={
            "body": item_data["body"],
            "last_updated": last_updated,
        },
    )

    if not created:
        content_changed = last_updated > obj.last_updated
        if content_changed:
            obj.body = item_data["body"]
            obj.last_updated = last_updated
            obj.save(update_fields=["body", "last_updated"])
        return obj, content_changed

    return obj, False  # newly created, not "changed"


def process_flag(keyword: Keyword, content_item: ContentItem, score: int) -> Flag | None:
    """
    Create or update a flag for a (keyword, content_item) pair.

    Suppression logic:
      - If a flag exists and is 'irrelevant':
          - If content_item.last_updated > flag.content_snapshot_ts → content changed,
            reset flag to pending with new score.
          - Otherwise → suppress (skip), return None.
      - If no flag exists → create with status=pending.
      - If flag exists and is pending/relevant → update score if it changed.
    """
    try:
        flag = Flag.objects.get(keyword=keyword, content_item=content_item)
    except Flag.DoesNotExist:
        return Flag.objects.create(
            keyword=keyword,
            content_item=content_item,
            score=score,
            status=Flag.Status.PENDING,
            content_snapshot_ts=content_item.last_updated,
        )

    if flag.status == Flag.Status.IRRELEVANT:
        if content_item.last_updated > flag.content_snapshot_ts:
            # Content changed after reviewer dismissed it — resurface
            flag.score = score
            flag.status = Flag.Status.PENDING
            flag.content_snapshot_ts = content_item.last_updated
            flag.save(update_fields=["score", "status", "content_snapshot_ts"])
            return flag
        # Still suppressed
        return None

    # pending or relevant: just refresh the score and snapshot
    flag.score = score
    flag.content_snapshot_ts = content_item.last_updated
    flag.save(update_fields=["score", "content_snapshot_ts"])
    return flag


def run_scan(source: str = "mock", query: str = "technology") -> dict:
    """
    Main entry point for a scan run.
    Fetches content, scores against all keywords, creates/updates flags.
    Returns a summary dict.
    """
    raw_items = get_content(source=source, query=query)
    keywords = list(Keyword.objects.all())

    if not keywords:
        return {"error": "No keywords defined. Add keywords before scanning."}

    created = 0
    updated = 0
    suppressed = 0
    items_processed = 0

    for item_data in raw_items:
        content_item, _ = upsert_content_item(item_data)
        items_processed += 1

        for keyword in keywords:
            score = compute_score(keyword.name, content_item.title, content_item.body)
            if score == 0:
                continue

            flag = process_flag(keyword, content_item, score)
            if flag is None:
                suppressed += 1
            elif flag.pk and flag.status == Flag.Status.PENDING:
                # Distinguish new vs updated by checking created_at == updated_at
                if flag.created_at == flag.updated_at:
                    created += 1
                else:
                    updated += 1
            else:
                updated += 1

    return {
        "source": source,
        "items_processed": items_processed,
        "keywords_active": len(keywords),
        "flags_created": created,
        "flags_updated": updated,
        "flags_suppressed": suppressed,
    }
