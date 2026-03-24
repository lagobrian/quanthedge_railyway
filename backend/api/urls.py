from django.urls import path
from . import views
from . import stripe_views

urlpatterns = [
    # Auth
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify-email/', views.verify_email_view, name='verify-email'),
    path('resend-verification/', views.resend_verification_view, name='resend-verification'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.profile_update_view, name='profile-update'),
    path('password/reset/', views.password_reset_view, name='password-reset'),
    path('password/reset/confirm/', views.password_reset_confirm_view, name='password-reset-confirm'),

    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),

    # Posts
    path('posts/', views.PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<slug:slug>/', views.PostDetailView.as_view(), name='post-detail'),
    path('posts/<slug:slug>/delete/', views.post_delete_view, name='post-delete'),
    path('posts/<slug:slug>/like/', views.post_like_view, name='post-like'),
    path('posts/<slug:slug>/bookmark/', views.post_bookmark_view, name='post-bookmark'),
    path('posts/<slug:slug>/pin/', views.post_pin_view, name='post-pin'),
    path('posts/<slug:slug>/reactions/', views.post_reactions_view, name='post-reactions'),
    path('posts/<slug:slug>/react/', views.post_reaction_view, name='post-react'),

    # Comments
    path('posts/<slug:slug>/comments/', views.comment_list_view, name='comment-list'),
    path('posts/<slug:slug>/comment/', views.comment_create_view, name='comment-create'),
    path('comments/<int:comment_id>/like/', views.comment_like_view, name='comment-like'),
    path('comments/<int:comment_id>/moderate/', views.comment_moderate_view, name='comment-moderate'),
    path('comments/<int:comment_id>/report/', views.comment_report_view, name='comment-report'),

    # Dashboard
    path('dashboard/stats/', views.dashboard_stats_view, name='dashboard-stats'),
    path('dashboard/posts/', views.dashboard_posts_view, name='dashboard-posts'),
    path('dashboard/comments/', views.dashboard_comments_view, name='dashboard-comments'),
    path('dashboard/analytics/', views.dashboard_analytics_view, name='dashboard-analytics'),

    # Notifications
    path('notifications/', views.notification_list_view, name='notification-list'),
    path('notifications/mark-seen/', views.notification_mark_seen_view, name='notification-mark-seen'),

    # Newsletter
    path('newsletter/subscribe/', views.newsletter_subscribe_view, name='newsletter-subscribe'),
    path('newsletter/unsubscribe/', views.newsletter_unsubscribe_view, name='newsletter-unsubscribe'),

    # Bulk import
    path('dashboard/import-posts/', views.import_posts_view, name='import-posts'),

    # User management
    path('dashboard/users/', views.dashboard_users_view, name='dashboard-users'),
    path('dashboard/users/grant-premium/', views.dashboard_grant_premium_view, name='grant-premium'),

    # Newsletter sending
    path('dashboard/send-newsletter/<slug:slug>/', views.send_newsletter_view, name='send-newsletter'),
    path('dashboard/send-test-email/', views.send_test_email_view, name='send-test-email'),

    # Bulk data sync (admin only)
    path('sync/bulk-upload/', views.bulk_data_upload_view, name='bulk-upload'),

    # Stripe payments
    path('stripe/create-checkout/', stripe_views.create_checkout_view, name='stripe-checkout'),
    path('stripe/create-portal/', stripe_views.create_portal_view, name='stripe-portal'),
    path('stripe/subscription-status/', stripe_views.subscription_status_view, name='stripe-status'),
    path('stripe/webhook/', stripe_views.stripe_webhook_view, name='stripe-webhook'),
]
