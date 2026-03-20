from django.contrib import admin
from .models import ContentItem, Flag, Keyword


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at"]
    search_fields = ["name"]


@admin.register(ContentItem)
class ContentItemAdmin(admin.ModelAdmin):
    list_display = ["title", "source", "last_updated"]
    search_fields = ["title", "body"]
    list_filter = ["source"]


@admin.register(Flag)
class FlagAdmin(admin.ModelAdmin):
    list_display = ["keyword", "content_item", "score", "status", "content_snapshot_ts", "updated_at"]
    list_filter = ["status", "keyword"]
    search_fields = ["keyword__name", "content_item__title"]
