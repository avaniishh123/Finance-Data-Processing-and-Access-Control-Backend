from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Flag, Keyword
from .serializers import FlagSerializer, FlagStatusUpdateSerializer, KeywordSerializer
from .services.scanner import run_scan


class KeywordListCreateView(generics.ListCreateAPIView):
    queryset = Keyword.objects.all().order_by("name")
    serializer_class = KeywordSerializer


class ScanView(APIView):
    """
    Triggers a content scan.
    Optional query params:
      - source: 'mock' (default) or 'newsapi'
      - query: search term for newsapi (default: 'technology')
    """

    def post(self, request):
        source = request.data.get("source", "mock")
        query = request.data.get("query", "technology")

        if source not in ("mock", "newsapi"):
            return Response(
                {"error": "Invalid source. Use 'mock' or 'newsapi'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = run_scan(source=source, query=query)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Scan failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(result, status=status.HTTP_200_OK)


class FlagListView(generics.ListAPIView):
    serializer_class = FlagSerializer

    def get_queryset(self):
        qs = Flag.objects.select_related("keyword", "content_item").order_by("-score", "-created_at")

        # Optional filters
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        keyword_id = self.request.query_params.get("keyword")
        if keyword_id:
            qs = qs.filter(keyword_id=keyword_id)

        return qs


class FlagDetailView(generics.UpdateAPIView):
    queryset = Flag.objects.all()
    serializer_class = FlagStatusUpdateSerializer
    http_method_names = ["patch"]
