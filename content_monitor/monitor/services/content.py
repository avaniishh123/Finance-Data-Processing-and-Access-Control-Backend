"""
Content fetching service.

Supports two modes:
  - 'mock': loads from a local JSON fixture (default, no API key needed)
  - 'newsapi': fetches live headlines from newsapi.org (requires NEWSAPI_KEY in .env)

Each fetcher returns a list of dicts with keys:
    title, body, source, last_updated
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests
from django.conf import settings


MOCK_DATA_PATH = Path(__file__).resolve().parent.parent / "fixtures" / "mock_content.json"


def fetch_mock() -> list[dict]:
    with open(MOCK_DATA_PATH) as f:
        items = json.load(f)
    return items


def fetch_newsapi(query: str = "technology") -> list[dict]:
    api_key = settings.NEWSAPI_KEY
    if not api_key:
        raise ValueError("NEWSAPI_KEY is not set. Use mock source or add the key to .env.")

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "pageSize": 20,
        "language": "en",
        "apiKey": api_key,
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()

    articles = response.json().get("articles", [])
    results = []
    for article in articles:
        results.append({
            "title": article.get("title") or "",
            "body": article.get("description") or article.get("content") or "",
            "source": "newsapi",
            "last_updated": article.get("publishedAt") or datetime.now(timezone.utc).isoformat(),
        })
    return results


def get_content(source: str = "mock", query: str = "technology") -> list[dict]:
    if source == "newsapi":
        return fetch_newsapi(query=query)
    return fetch_mock()
