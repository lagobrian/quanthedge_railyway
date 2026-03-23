from django.contrib.auth.models import AbstractUser
from django.db import models
import shortuuid


class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    about = models.TextField(blank=True)
    country = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    twitter = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    is_premium = models.BooleanField(default=False)
    premium_until = models.DateTimeField(null=True, blank=True)
    is_author = models.BooleanField(default=False)
    is_analyst = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    @property
    def has_active_premium(self):
        if self.is_premium and self.premium_until is None:
            return True  # Lifetime premium
        if self.is_premium and self.premium_until:
            from django.utils import timezone
            return self.premium_until > timezone.now()
        return False

    def __str__(self):
        return self.email


class Category(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to='category_images/', blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.title


class Post(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]
    PUBLISHING_METHOD_CHOICES = [
        ('website', 'Website'),
        ('email', 'Email'),
        ('both', 'Both'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    title = models.CharField(max_length=500)
    slug = models.SlugField(unique=True, max_length=500)
    description = models.TextField(blank=True)
    excerpt = models.TextField(blank=True, max_length=500)
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    image_url = models.URLField(max_length=1000, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    tags = models.CharField(max_length=500, blank=True)
    is_pinned = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    publishing_method = models.CharField(max_length=20, choices=PUBLISHING_METHOD_CHOICES, default='website')
    send_as_email = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    view = models.IntegerField(default=0)
    reading_time = models.IntegerField(default=0)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_pinned', '-date']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Compute reading time from description (strip HTML tags)
        import math, re
        text = re.sub(r'<[^>]+>', '', self.description or '')
        word_count = len(text.split())
        self.reading_time = max(1, math.ceil(word_count / 200))
        super().save(*args, **kwargs)

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.comments.count()

    @property
    def bookmarks_count(self):
        return self.bookmarks.count()

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = shortuuid.uuid()[:10]
        super().save(*args, **kwargs)


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.title}"

    @property
    def likes_count(self):
        return self.comment_likes.count()

    @property
    def replies_count(self):
        return self.replies.count()


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user.username} likes {self.post.title}"


class CommentLike(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='comment_likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('comment', 'user')


class Bookmark(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='bookmarks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user.username} bookmarked {self.post.title}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_seen = models.BooleanField(default=False)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Notification for {self.user.username}"


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email
