from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Category, Comment, Like, Bookmark, Notification, NewsletterSubscriber

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'full_name', 'bio', 'about', 'country',
                  'image', 'twitter', 'linkedin', 'is_premium', 'is_author', 'is_analyst']
        read_only_fields = ['id', 'email', 'is_premium']


class UserMiniSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'profile']

    def get_profile(self, obj):
        return {'image': obj.image.url if obj.image else None}


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=True)
    username = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ['email', 'username', 'full_name', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        # Auto-generate username from email if not provided
        if not data.get('username'):
            base = data['email'].split('@')[0]
            username = base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base}{counter}"
                counter += 1
            data['username'] = username
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_active = False  # Inactive until email verified
        user.save()
        return user


class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'title', 'slug', 'image', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.filter(status='published').count()


class CommentSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    replies_count = serializers.IntegerField(read_only=True)
    replies = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'user', 'date', 'likes_count', 'replies_count',
                  'replies', 'parent_id', 'is_liked', 'is_approved']
        read_only_fields = ['id', 'date', 'user']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.comment_likes.filter(user=request.user).exists()
        return False


class PostListSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    category = serializers.StringRelatedField()
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    bookmarks_count = serializers.IntegerField(read_only=True)
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'slug', 'excerpt', 'image', 'image_url', 'thumbnail',
                  'status', 'view', 'date', 'reading_time', 'likes_count', 'comments_count',
                  'bookmarks_count', 'is_premium', 'send_as_email', 'email_sent',
                  'category', 'user', 'is_pinned', 'tags']

    def get_thumbnail(self, obj):
        if obj.image:
            return obj.image.url
        if obj.image_url:
            return obj.image_url
        # Extract first image from HTML content
        import re
        match = re.search(r'<img[^>]+src="([^"]+)"', obj.description or '')
        if match:
            return match.group(1)
        return None


class PostDetailSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    category = serializers.StringRelatedField()
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    bookmarks_count = serializers.IntegerField(read_only=True)
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'slug', 'description', 'excerpt', 'image', 'image_url',
                  'thumbnail', 'status', 'view', 'date', 'reading_time', 'likes_count',
                  'comments_count', 'bookmarks_count', 'is_premium', 'send_as_email',
                  'email_sent', 'publishing_method', 'category', 'user', 'comments',
                  'tags', 'is_pinned']

    def get_thumbnail(self, obj):
        if obj.image:
            return obj.image.url
        if obj.image_url:
            return obj.image_url
        import re
        match = re.search(r'<img[^>]+src="([^"]+)"', obj.description or '')
        if match:
            return match.group(1)
        return None


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id', 'slug', 'title', 'description', 'excerpt', 'image', 'image_url', 'status', 'category',
                  'tags', 'is_premium', 'is_pinned', 'publishing_method', 'send_as_email']
        read_only_fields = ['id', 'slug']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_seen', 'date']


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ['email']
