from rest_framework import serializers
from .models import Keyword, ContentItem, Flag


class KeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Keyword
        fields = ["id", "name", "created_at"]
        read_only_fields = ["id", "created_at"]


class ContentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentItem
        fields = ["id", "title", "source", "body", "last_updated"]


class FlagSerializer(serializers.ModelSerializer):
    keyword_name = serializers.CharField(source="keyword.name", read_only=True)
    content_title = serializers.CharField(source="content_item.title", read_only=True)
    content_source = serializers.CharField(source="content_item.source", read_only=True)

    class Meta:
        model = Flag
        fields = [
            "id",
            "keyword",
            "keyword_name",
            "content_item",
            "content_title",
            "content_source",
            "score",
            "status",
            "content_snapshot_ts",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "keyword",
            "keyword_name",
            "content_item",
            "content_title",
            "content_source",
            "score",
            "content_snapshot_ts",
            "created_at",
            "updated_at",
        ]


class FlagStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flag
        fields = ["status"]

    def validate_status(self, value):
        if value not in Flag.Status.values:
            raise serializers.ValidationError(f"Invalid status. Choose from: {Flag.Status.values}")
        return value
