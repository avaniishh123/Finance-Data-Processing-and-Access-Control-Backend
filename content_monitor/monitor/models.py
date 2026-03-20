from django.db import models


class Keyword(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ContentItem(models.Model):
    title = models.CharField(max_length=500)
    source = models.CharField(max_length=100)  # e.g. 'newsapi', 'rss', 'mock'
    body = models.TextField()
    last_updated = models.DateTimeField()

    class Meta:
        # A content item is uniquely identified by its title + source combination.
        # This is used for upsert logic during import.
        unique_together = ("title", "source")

    def __str__(self):
        return f"[{self.source}] {self.title}"


class Flag(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RELEVANT = "relevant", "Relevant"
        IRRELEVANT = "irrelevant", "Irrelevant"

    keyword = models.ForeignKey(Keyword, on_delete=models.CASCADE, related_name="flags")
    content_item = models.ForeignKey(ContentItem, on_delete=models.CASCADE, related_name="flags")
    score = models.IntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Tracks the content item's last_updated value at the time this flag was last evaluated.
    # Used to detect whether the content changed after a flag was marked irrelevant.
    content_snapshot_ts = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("keyword", "content_item")

    def __str__(self):
        return f"Flag({self.keyword} | {self.content_item} | {self.status})"
