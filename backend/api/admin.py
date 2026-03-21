from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Post, Comment, Like, Bookmark, Notification, NewsletterSubscriber


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'full_name', 'is_author', 'is_analyst', 'is_premium', 'is_staff']
    list_filter = ['is_author', 'is_analyst', 'is_premium', 'is_staff']
    search_fields = ['email', 'username', 'full_name']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('full_name', 'bio', 'about', 'country', 'image', 'twitter', 'linkedin', 'is_premium', 'is_author', 'is_analyst')}),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug']
    prepopulated_fields = {'slug': ('title',)}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'status', 'is_pinned', 'is_premium', 'view', 'date']
    list_filter = ['status', 'is_premium', 'is_pinned', 'category']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'is_approved', 'date']
    list_filter = ['is_approved']


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'date']


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'date']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'message', 'is_seen', 'date']
    list_filter = ['is_seen']


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ['email', 'date']
