from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.db.models import Sum, Count, Q
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Post, Category, Comment, Like, CommentLike, Bookmark, Notification, NewsletterSubscriber
from .serializers import (
    UserProfileSerializer, RegisterSerializer, CategorySerializer,
    PostListSerializer, PostDetailSerializer, PostCreateUpdateSerializer,
    CommentSerializer, NotificationSerializer, NewsletterSubscriberSerializer,
)
from .permissions import IsAuthor, IsOwnerOrReadOnly

User = get_user_model()


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'full_name': user.full_name,
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def profile_update_view(request):
    serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_view(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'message': 'If the email exists, a reset link has been sent.'})

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_url = f"{settings.SITE_URL}/reset-password/{uid}/{token}"

    html_message = render_to_string('password_reset_email.html', {
        'user': user,
        'reset_url': reset_url,
        'site_name': settings.SITE_NAME,
    })
    send_mail(
        subject='Password Reset',
        message=f'Reset your password: {reset_url}',
        from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@quanthedge.com',
        recipient_list=[email],
        html_message=html_message,
        fail_silently=True,
    )
    return Response({'message': 'If the email exists, a reset link has been sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    if not all([uid, token, new_password]):
        return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password has been reset successfully.'})


# ─── Categories ──────────────────────────────────────────────────────────────

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None


# ─── Posts ───────────────────────────────────────────────────────────────────

class PostListCreateView(generics.ListCreateAPIView):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['date', 'view', 'title']
    ordering = ['-is_pinned', '-date']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateUpdateSerializer
        return PostListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        qs = Post.objects.filter(status='published')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)
        return qs


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return PostCreateUpdateSerializer
        return PostDetailSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        return [AllowAny()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view += 1
        instance.save(update_fields=['view'])
        serializer = self.get_serializer(instance)
        data = serializer.data

        # Paywall: truncate content for premium posts if user isn't premium
        if instance.is_premium:
            is_premium_user = (
                request.user.is_authenticated and
                (request.user.has_active_premium or request.user == instance.user)
            )
            if not is_premium_user:
                # Show first 500 chars + paywall message
                import re
                full_html = data.get('description', '')
                text = re.sub(r'<[^>]+>', '', full_html)
                if len(text) > 500:
                    # Find a good truncation point in HTML
                    truncated = full_html[:1500]  # rough HTML cut
                    # Close any open tags
                    data['description'] = truncated + '<div class="paywall-notice">...</div>'
                    data['is_paywalled'] = True
                else:
                    data['is_paywalled'] = False
            else:
                data['is_paywalled'] = False
        else:
            data['is_paywalled'] = False

        return Response(data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def post_delete_view(request, slug):
    try:
        post = Post.objects.get(slug=slug, user=request.user)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
    post.delete()
    return Response({'message': 'Post deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def post_like_view(request, slug):
    try:
        post = Post.objects.get(slug=slug)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

    like, created = Like.objects.get_or_create(post=post, user=request.user)
    if not created:
        like.delete()
        return Response({'liked': False, 'likes_count': post.likes_count})

    Notification.objects.create(
        user=post.user,
        message=f"{request.user.username} liked your post: {post.title}"
    )
    return Response({'liked': True, 'likes_count': post.likes_count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def post_bookmark_view(request, slug):
    try:
        post = Post.objects.get(slug=slug)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

    bookmark, created = Bookmark.objects.get_or_create(post=post, user=request.user)
    if not created:
        bookmark.delete()
        return Response({'bookmarked': False, 'bookmarks_count': post.bookmarks_count})
    return Response({'bookmarked': True, 'bookmarks_count': post.bookmarks_count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def post_pin_view(request, slug):
    try:
        post = Post.objects.get(slug=slug, user=request.user)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
    post.is_pinned = not post.is_pinned
    post.save(update_fields=['is_pinned'])
    return Response({'is_pinned': post.is_pinned})


# ─── Comments ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def comment_list_view(request, slug):
    try:
        post = Post.objects.get(slug=slug)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
    comments = post.comments.filter(parent__isnull=True, is_approved=True)
    serializer = CommentSerializer(comments, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_create_view(request, slug):
    try:
        post = Post.objects.get(slug=slug)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

    content = request.data.get('content', '')
    parent_id = request.data.get('parent_id')
    parent = None
    if parent_id:
        try:
            parent = Comment.objects.get(id=parent_id, post=post)
        except Comment.DoesNotExist:
            pass

    comment = Comment.objects.create(
        post=post, user=request.user, content=content, parent=parent
    )
    if post.user != request.user:
        Notification.objects.create(
            user=post.user,
            message=f"{request.user.username} commented on your post: {post.title}"
        )

    serializer = CommentSerializer(comment, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_like_view(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found.'}, status=status.HTTP_404_NOT_FOUND)

    like, created = CommentLike.objects.get_or_create(comment=comment, user=request.user)
    if not created:
        like.delete()
        return Response({'liked': False, 'likes_count': comment.likes_count})
    return Response({'liked': True, 'likes_count': comment.likes_count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_moderate_view(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found.'}, status=status.HTTP_404_NOT_FOUND)

    if comment.post.user != request.user:
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    action = request.data.get('action', 'approve')
    if action == 'approve':
        comment.is_approved = True
        comment.save(update_fields=['is_approved'])
        return Response({'message': 'Comment approved.', 'is_approved': True})
    elif action == 'reject':
        comment.is_approved = False
        comment.save(update_fields=['is_approved'])
        return Response({'message': 'Comment rejected.', 'is_approved': False})
    elif action == 'delete':
        comment.delete()
        return Response({'message': 'Comment deleted.'}, status=status.HTTP_204_NO_CONTENT)
    return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


# ─── Dashboard ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    user_posts = Post.objects.filter(user=request.user)
    stats = {
        'total_posts': user_posts.count(),
        'published_posts': user_posts.filter(status='published').count(),
        'draft_posts': user_posts.filter(status='draft').count(),
        'premium_posts': user_posts.filter(is_premium=True).count(),
        'total_views': user_posts.aggregate(total=Sum('view'))['total'] or 0,
        'total_likes': sum(p.likes_count for p in user_posts),
        'total_comments': sum(p.comments_count for p in user_posts),
        'total_bookmarks': sum(p.bookmarks_count for p in user_posts),
        'subscriber_count': NewsletterSubscriber.objects.count(),
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_posts_view(request):
    qs = Post.objects.filter(user=request.user)
    status_filter = request.query_params.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)
    serializer = PostListSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_comments_view(request):
    comments = Comment.objects.filter(post__user=request.user).select_related('user', 'post')
    serializer = CommentSerializer(comments, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_analytics_view(request):
    user_posts = Post.objects.filter(user=request.user)
    analytics = {
        'views_by_post': list(user_posts.values('title', 'slug', 'view').order_by('-view')[:10]),
        'likes_by_post': [
            {'title': p.title, 'slug': p.slug, 'likes_count': p.likes_count}
            for p in sorted(user_posts, key=lambda p: p.likes_count, reverse=True)[:10]
        ],
        'total_views': user_posts.aggregate(total=Sum('view'))['total'] or 0,
    }
    return Response(analytics)


# ─── Notifications ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list_view(request):
    notifications = request.user.notifications.all()[:20]
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_seen_view(request):
    request.user.notifications.filter(is_seen=False).update(is_seen=True)
    return Response({'message': 'All notifications marked as seen.'})


# ─── Newsletter ──────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def newsletter_subscribe_view(request):
    serializer = NewsletterSubscriberSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Subscribed successfully.'}, status=status.HTTP_201_CREATED)
    if 'email' in serializer.errors and any('unique' in str(e) for e in serializer.errors['email']):
        return Response({'message': 'Already subscribed.'}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Bulk Import ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_posts_view(request):
    """Import posts from a Substack export ZIP file."""
    import zipfile
    import csv
    import io
    import re
    from django.utils.text import slugify

    if not request.user.is_author:
        return Response({'error': 'Only authors can import posts.'}, status=status.HTTP_403_FORBIDDEN)

    uploaded = request.FILES.get('file')
    if not uploaded:
        return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

    if not uploaded.name.endswith('.zip'):
        return Response({'error': 'Please upload a .zip file.'}, status=status.HTTP_400_BAD_REQUEST)

    imported = 0
    errors_list = []

    try:
        with zipfile.ZipFile(uploaded, 'r') as zf:
            # Find posts.csv
            csv_files = [n for n in zf.namelist() if n.endswith('posts.csv')]
            if not csv_files:
                return Response({'error': 'No posts.csv found in ZIP.'}, status=status.HTTP_400_BAD_REQUEST)

            csv_content = zf.read(csv_files[0]).decode('utf-8')
            reader = csv.DictReader(io.StringIO(csv_content))

            html_files = {n: n for n in zf.namelist() if n.endswith('.html')}

            for row in reader:
                post_id = row.get('post_id', '').strip()
                is_published = row.get('is_published', '').strip().lower() == 'true'
                title = row.get('title', '').strip()
                subtitle = row.get('subtitle', '').strip()
                audience = row.get('audience', '').strip()

                if not is_published or not title:
                    continue

                # Find HTML file
                html_name = None
                id_prefix = post_id.split('.')[0]
                for name in html_files:
                    if id_prefix in name and name.endswith('.html'):
                        html_name = name
                        break

                if not html_name:
                    errors_list.append(f"No HTML for: {title[:40]}")
                    continue

                content = zf.read(html_name).decode('utf-8', errors='replace')

                base_slug = slugify(title)[:80]
                slug = base_slug
                counter = 1
                while Post.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1

                excerpt = subtitle or ''
                if not excerpt:
                    m = re.search(r'<p[^>]*>(.*?)</p>', content, re.DOTALL)
                    if m:
                        excerpt = re.sub(r'<[^>]+>', '', m.group(1))[:300]

                post = Post(
                    user=request.user,
                    title=title,
                    slug=slug,
                    description=content,
                    excerpt=excerpt[:500],
                    status='published',
                    is_premium=(audience == 'only_paid'),
                    publishing_method='website',
                )
                post.save()
                imported += 1

    except zipfile.BadZipFile:
        return Response({'error': 'Invalid ZIP file.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': f'Imported {imported} posts.',
        'imported': imported,
        'errors': errors_list[:10],
    })


# ─── User Management (Author only) ──────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_users_view(request):
    """List all users with activity stats. Only for authors."""
    if not request.user.is_author:
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    from django.utils import timezone
    users = User.objects.all().order_by('-date_joined')
    data = []
    for u in users:
        data.append({
            'id': u.id,
            'email': u.email,
            'full_name': u.full_name or u.username,
            'date_joined': u.date_joined,
            'last_login': u.last_login,
            'is_premium': u.is_premium,
            'premium_until': u.premium_until,
            'has_active_premium': u.has_active_premium,
            'is_author': u.is_author,
            'is_analyst': u.is_analyst,
            'total_comments': u.comments.count(),
            'total_likes': u.likes.count(),
            'total_bookmarks': u.bookmarks.count(),
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dashboard_grant_premium_view(request):
    """Grant premium access to a user for a specific duration. Authors only."""
    if not request.user.is_author:
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    from django.utils import timezone
    from datetime import timedelta

    user_id = request.data.get('user_id')
    duration = request.data.get('duration')  # e.g. '1d', '1w', '1m', '3m', '6m', '1y', 'lifetime', 'revoke'

    if not user_id or not duration:
        return Response({'error': 'user_id and duration are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if duration == 'revoke':
        target.is_premium = False
        target.premium_until = None
        target.save(update_fields=['is_premium', 'premium_until'])
        return Response({'message': f'Premium revoked for {target.email}.'})

    duration_map = {
        '1d': timedelta(days=1),
        '1w': timedelta(weeks=1),
        '1m': timedelta(days=30),
        '3m': timedelta(days=90),
        '6m': timedelta(days=180),
        '1y': timedelta(days=365),
        '2y': timedelta(days=730),
        'lifetime': None,
    }

    if duration not in duration_map:
        return Response({'error': f'Invalid duration. Use: {", ".join(duration_map.keys())}'}, status=status.HTTP_400_BAD_REQUEST)

    target.is_premium = True
    delta = duration_map[duration]
    if delta is None:
        target.premium_until = None  # Lifetime
    else:
        target.premium_until = timezone.now() + delta
    target.save(update_fields=['is_premium', 'premium_until'])

    label = 'lifetime' if delta is None else duration
    return Response({'message': f'Premium granted to {target.email} for {label}.'})


# ─── Newsletter Sending ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_test_email_view(request):
    """Send a test email to verify SES is working."""
    if not request.user.is_author:
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    to_email = request.data.get('email', request.user.email)

    try:
        send_mail(
            subject='Test Email from Quant (h)Edge',
            message='This is a test email to verify your email sending setup is working.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message='''
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #061829; color: white;">
                <h1 style="color: #00ced1;">Quant (h)Edge</h1>
                <p>This is a test email to verify your email sending setup is working correctly.</p>
                <p style="color: #888; font-size: 12px;">If you received this, Amazon SES is configured properly.</p>
            </div>
            ''',
            fail_silently=False,
        )
        return Response({'message': f'Test email sent to {to_email}.'})
    except Exception as e:
        return Response({'error': f'Failed to send: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_newsletter_view(request, slug):
    """Send a post as newsletter to all subscribers."""
    if not request.user.is_author:
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        post = Post.objects.get(slug=slug, user=request.user)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

    if post.email_sent:
        return Response({'error': 'Newsletter already sent for this post.'}, status=status.HTTP_400_BAD_REQUEST)

    subscribers = NewsletterSubscriber.objects.values_list('email', flat=True)
    if not subscribers:
        return Response({'error': 'No subscribers to send to.'}, status=status.HTTP_400_BAD_REQUEST)

    from django.template.loader import render_to_string
    from datetime import datetime

    html_content = render_to_string('email/newsletter_template.html', {
        'post': post,
        'title': post.title,
        'description': post.description,
        'site_url': settings.SITE_URL,
        'site_name': settings.SITE_NAME,
        'current_year': datetime.now().year,
        'unsubscribe_url': f'{settings.SITE_URL}/unsubscribe',
    })

    sent = 0
    failed = 0
    # Send in batches of 50 to avoid SES rate limits
    subscriber_list = list(subscribers)
    batch_size = 50

    for i in range(0, len(subscriber_list), batch_size):
        batch = subscriber_list[i:i + batch_size]
        for email_addr in batch:
            try:
                send_mail(
                    subject=post.title,
                    message=post.excerpt or post.title,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email_addr],
                    html_message=html_content,
                    fail_silently=False,
                )
                sent += 1
            except Exception:
                failed += 1

    post.email_sent = True
    post.save(update_fields=['email_sent'])

    return Response({
        'message': f'Newsletter sent! {sent} delivered, {failed} failed.',
        'sent': sent,
        'failed': failed,
    })
