# Content Monitoring & Flagging System

A Django + DRF backend that ingests content, scores it against user-defined keywords, and supports a human review workflow with suppression rules.

---

## Setup

```bash
# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment (optional — defaults work out of the box)
cp .env.example .env
# Edit .env if you want to use NewsAPI (see Content Sources below)

# 4. Run migrations
python manage.py migrate

# 5. Start the server
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

---

## Content Sources

The system supports two content sources, selected via the `source` field in the scan request.

### Mock (default — no setup required)

Uses `monitor/fixtures/mock_content.json`. Eight pre-loaded articles covering Django, Python, automation, data pipelines, and unrelated topics.

### NewsAPI (live content)

Requires a free API key from [newsapi.org](https://newsapi.org).

Add to `.env`:
```
NEWSAPI_KEY=your_key_here
```

Then pass `"source": "newsapi"` in the scan request body.

---

## API Reference

### Create a keyword

```
POST /keywords/
Content-Type: application/json

{"name": "django"}
```

### List keywords

```
GET /keywords/
```

### Trigger a scan

```
POST /scan/
Content-Type: application/json

{"source": "mock"}
```

With NewsAPI:
```json
{"source": "newsapi", "query": "python programming"}
```

### List flags

```
GET /flags/
```

Optional query params:
- `?status=pending` — filter by status (`pending`, `relevant`, `irrelevant`)
- `?keyword=1` — filter by keyword ID

### Update flag status (review workflow)

```
PATCH /flags/{id}/
Content-Type: application/json

{"status": "irrelevant"}
```

Valid status values: `pending`, `relevant`, `irrelevant`

---

## Sample curl Commands

```bash
# Add keywords
curl -X POST http://localhost:8000/keywords/ \
  -H "Content-Type: application/json" \
  -d '{"name": "django"}'

curl -X POST http://localhost:8000/keywords/ \
  -H "Content-Type: application/json" \
  -d '{"name": "python"}'

curl -X POST http://localhost:8000/keywords/ \
  -H "Content-Type: application/json" \
  -d '{"name": "automation"}'

curl -X POST http://localhost:8000/keywords/ \
  -H "Content-Type: application/json" \
  -d '{"name": "data pipeline"}'

# Run a scan
curl -X POST http://localhost:8000/scan/ \
  -H "Content-Type: application/json" \
  -d '{"source": "mock"}'

# List all flags
curl http://localhost:8000/flags/

# List only pending flags
curl "http://localhost:8000/flags/?status=pending"

# Mark a flag as irrelevant
curl -X PATCH http://localhost:8000/flags/1/ \
  -H "Content-Type: application/json" \
  -d '{"status": "irrelevant"}'
```

---

## Scoring Logic

| Condition | Score |
|---|---|
| Keyword phrase appears in title | 100 |
| Any word of a multi-word keyword appears in title | 70 |
| Keyword appears only in body | 40 |
| No match | 0 (no flag created) |

Matching is case-insensitive substring matching. A score of 0 means no flag is created for that pair.

---

## Suppression Logic

This is the core business rule.

When a reviewer marks a flag as `irrelevant`, that decision is respected on all future scans **unless the underlying content item changes**.

Implementation:
- Each `Flag` stores a `content_snapshot_ts` — the `last_updated` value of the `ContentItem` at the time the flag was last evaluated.
- On each scan, before creating or updating a flag, the scanner checks:
  - If `flag.status == irrelevant` AND `content_item.last_updated <= flag.content_snapshot_ts` → **suppress** (skip the flag entirely).
  - If `flag.status == irrelevant` AND `content_item.last_updated > flag.content_snapshot_ts` → **resurface**: reset status to `pending`, update score and snapshot.

This means a reviewer's decision is sticky until the content itself changes, at which point the item is treated as new.

### Assumptions

- `ContentItem` is uniquely identified by `(title, source)`. This is a simplification — a real system would use a canonical URL or external ID.
- `last_updated` from the source is trusted as the change signal. If a source always sends the current timestamp regardless of actual changes, suppression would break. In production, a content hash would be more reliable.
- The mock source always sends the same `last_updated`, so suppression is stable across repeated mock scans. To test resurfacing, update the timestamp in the fixture or simulate it programmatically.

---

## Project Structure

```
content_monitor/
├── config/              # Django project settings, urls, wsgi
├── monitor/
│   ├── models.py        # Keyword, ContentItem, Flag
│   ├── serializers.py   # DRF serializers
│   ├── views.py         # API views (thin — delegate to services)
│   ├── urls.py
│   ├── admin.py
│   ├── fixtures/
│   │   └── mock_content.json
│   └── services/
│       ├── content.py   # Content fetching (mock + newsapi)
│       └── scanner.py   # Scoring, upsert, suppression, scan orchestration
├── manage.py
├── requirements.txt
└── .env.example
```

---

## Trade-offs & Notes

- **No authentication** — out of scope for this assignment. A real system would use token or session auth on the review endpoints.
- **Synchronous scan** — the `POST /scan/` endpoint runs the scan inline. For large datasets, this should be offloaded to a task queue (Celery). The service layer is already isolated, making that a straightforward addition.
- **SQLite** — fine for local development. The ORM abstractions mean switching to Postgres requires only a settings change.
- **Deduplication** — handled via `unique_together` on `(keyword, content_item)` for flags and `(title, source)` for content items. Repeated scans are idempotent.
