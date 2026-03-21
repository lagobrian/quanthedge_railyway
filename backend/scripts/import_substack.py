"""
import_substack.py
Import blog posts from Substack export (from_substack folder).
Reads posts.csv for metadata and HTML files for content.
"""
import os
import sys
import csv
import re
from pathlib import Path
from datetime import datetime

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.utils.text import slugify
from api.models import User, Post, Category


def import_posts():
    substack_dir = BACKEND_DIR.parent / 'from_substack'
    posts_csv = substack_dir / 'posts.csv'
    posts_dir = substack_dir / 'posts'

    if not posts_csv.exists():
        print("posts.csv not found")
        return

    # Get or create the author
    try:
        author = User.objects.get(email='LagoBrian@outlook.com')
    except User.DoesNotExist:
        author = User.objects.filter(is_author=True).first()
        if not author:
            print("No author user found. Create one first.")
            return

    # Create default categories
    categories = {}
    for name, slug in [
        ('Crypto', 'crypto'),
        ('Markets', 'markets'),
        ('Quantitative Finance', 'quant-finance'),
        ('Opinion', 'opinion'),
        ('Trading', 'trading'),
    ]:
        cat, _ = Category.objects.get_or_create(slug=slug, defaults={'title': name})
        categories[slug] = cat

    # Read posts.csv
    with open(posts_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Found {len(rows)} posts in CSV")
    imported = 0
    skipped = 0

    for row in rows:
        post_id = row.get('post_id', '').strip()
        is_published = row.get('is_published', '').strip().lower() == 'true'
        title = row.get('title', '').strip()
        subtitle = row.get('subtitle', '').strip()
        audience = row.get('audience', '').strip()
        post_date_str = row.get('post_date', '').strip()

        if not is_published or not title:
            skipped += 1
            continue

        # Find matching HTML file
        html_file = None
        for f in posts_dir.iterdir():
            if f.name.startswith(post_id.split('.')[0]) and f.name.endswith('.html'):
                html_file = f
                break

        if not html_file:
            # Try matching by slug part of post_id
            slug_part = post_id.split('.', 1)[1] if '.' in post_id else ''
            for f in posts_dir.iterdir():
                if slug_part and slug_part in f.name and f.name.endswith('.html'):
                    html_file = f
                    break

        if not html_file:
            print(f"  No HTML found for: {title[:50]}...")
            skipped += 1
            continue

        # Read HTML content
        content = html_file.read_text(encoding='utf-8', errors='replace')

        # Parse date
        post_date = None
        if post_date_str:
            try:
                post_date = datetime.fromisoformat(post_date_str.replace('Z', '+00:00'))
            except Exception:
                pass

        # Generate slug
        base_slug = slugify(title)[:80]
        slug = base_slug
        counter = 1
        while Post.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Determine if premium (paid-only)
        is_premium = audience == 'only_paid'

        # Auto-categorize based on title keywords
        category = categories.get('markets')  # default
        title_lower = title.lower()
        if any(kw in title_lower for kw in ['crypto', 'bitcoin', 'btc', 'altcoin', 'breadth']):
            category = categories.get('crypto')
        elif any(kw in title_lower for kw in ['quant', 'backtest', 'model', 'factor', 'vix', 'volatility']):
            category = categories.get('quant-finance')
        elif any(kw in title_lower for kw in ['trade', 'trading', 'strategy']):
            category = categories.get('trading')
        elif any(kw in title_lower for kw in ['opinion', 'thought', 'proverb', 'laugh', 'meme']):
            category = categories.get('opinion')

        # Create excerpt from subtitle or first paragraph
        excerpt = subtitle if subtitle else ''
        if not excerpt:
            # Extract first paragraph text
            text_match = re.search(r'<p[^>]*>(.*?)</p>', content, re.DOTALL)
            if text_match:
                excerpt = re.sub(r'<[^>]+>', '', text_match.group(1))[:300]

        post = Post(
            user=author,
            title=title,
            slug=slug,
            description=content,
            excerpt=excerpt[:500],
            status='published',
            is_premium=is_premium,
            category=category,
            publishing_method='website',
        )
        post.save()

        # Override auto date if we have one
        if post_date:
            Post.objects.filter(pk=post.pk).update(date=post_date)

        imported += 1

    print(f"\nImport complete: {imported} imported, {skipped} skipped")
    print(f"Total posts in DB: {Post.objects.count()}")
    print(f"Premium posts: {Post.objects.filter(is_premium=True).count()}")


if __name__ == '__main__':
    import_posts()
