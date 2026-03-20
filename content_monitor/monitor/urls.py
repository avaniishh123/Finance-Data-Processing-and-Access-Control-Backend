from django.urls import path
from .views import FlagDetailView, FlagListView, KeywordListCreateView, ScanView

urlpatterns = [
    path("keywords/", KeywordListCreateView.as_view(), name="keyword-list-create"),
    path("scan/", ScanView.as_view(), name="scan"),
    path("flags/", FlagListView.as_view(), name="flag-list"),
    path("flags/<int:pk>/", FlagDetailView.as_view(), name="flag-detail"),
]
