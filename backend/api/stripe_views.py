"""Stripe payment integration views."""
import stripe
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth import get_user_model
User = get_user_model()

stripe.api_key = settings.STRIPE_SECRET_KEY

# Plan config: maps plan ID + billing cycle to Stripe price amounts (in cents)
PLAN_CONFIG = {
    'standard': {
        'monthly': {'amount': 999, 'interval': 'month', 'name': 'Standard Monthly'},
        'annual': {'amount': 9999, 'interval': 'year', 'name': 'Standard Annual'},
        'premium_days_monthly': 30,
        'premium_days_annual': 365,
    },
    'premium': {
        'monthly': {'amount': 1999, 'interval': 'month', 'name': 'Premium Monthly'},
        'annual': {'amount': 19999, 'interval': 'year', 'name': 'Premium Annual'},
        'premium_days_monthly': 30,
        'premium_days_annual': 365,
    },
}


def get_or_create_price(plan_id, billing):
    """Get or create a Stripe Price for the given plan and billing cycle."""
    config = PLAN_CONFIG[plan_id][billing]
    lookup_key = f'{plan_id}_{billing}'

    # Check if price exists with this lookup key
    prices = stripe.Price.list(lookup_keys=[lookup_key], limit=1)
    if prices.data:
        return prices.data[0]

    # Create product and price
    product = stripe.Product.create(
        name=f'Quant (h)Edge - {config["name"]}',
        metadata={'plan': plan_id, 'billing': billing},
    )
    price = stripe.Price.create(
        product=product.id,
        unit_amount=config['amount'],
        currency='usd',
        recurring={'interval': config['interval']},
        lookup_key=lookup_key,
    )
    return price


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_view(request):
    """Create a Stripe Checkout session for subscription."""
    plan_id = request.data.get('plan')
    billing = request.data.get('billing', 'monthly')

    if plan_id not in PLAN_CONFIG:
        return Response({'error': 'Invalid plan.'}, status=status.HTTP_400_BAD_REQUEST)
    if billing not in ('monthly', 'annual'):
        return Response({'error': 'Invalid billing cycle.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        price = get_or_create_price(plan_id, billing)

        # Check if user already has a Stripe customer ID
        customer_id = None
        customers = stripe.Customer.list(email=request.user.email, limit=1)
        if customers.data:
            customer_id = customers.data[0].id
        else:
            customer = stripe.Customer.create(
                email=request.user.email,
                name=request.user.full_name or request.user.username,
                metadata={'user_id': str(request.user.id)},
            )
            customer_id = customer.id

        # Trial period (7 days for new subscribers)
        trial_days = 7 if not request.user.is_premium else 0

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{'price': price.id, 'quantity': 1}],
            mode='subscription',
            allow_promotion_codes=True,  # Enable discount codes at checkout
            subscription_data={
                'trial_period_days': trial_days,
            } if trial_days > 0 else {},
            success_url=settings.SITE_URL + '/pricing?success=true&session_id={CHECKOUT_SESSION_ID}',
            cancel_url=settings.SITE_URL + '/pricing?canceled=true',
            metadata={
                'user_id': str(request.user.id),
                'plan': plan_id,
                'billing': billing,
            },
        )
        return Response({'url': session.url})
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_portal_view(request):
    """Create a Stripe Customer Portal session for managing subscriptions."""
    try:
        customers = stripe.Customer.list(email=request.user.email, limit=1)
        if not customers.data:
            return Response({'error': 'No subscription found.'}, status=status.HTTP_404_NOT_FOUND)

        session = stripe.billing_portal.Session.create(
            customer=customers.data[0].id,
            return_url=settings.SITE_URL + '/profile',
        )
        return Response({'url': session.url})
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status_view(request):
    """Check user's current subscription status."""
    user = request.user
    return Response({
        'is_premium': user.is_premium,
        'premium_until': user.premium_until,
        'has_active_premium': user.has_active_premium if hasattr(user, 'has_active_premium') else user.is_premium,
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook_view(request):
    """Handle Stripe webhooks for payment events."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    if not settings.STRIPE_WEBHOOK_SECRET:
        return HttpResponse(status=400)
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    # Handle subscription events
    if event.type == 'checkout.session.completed':
        session = event.data.object
        user_id = session.get('metadata', {}).get('user_id')
        plan = session.get('metadata', {}).get('plan', 'standard')
        billing = session.get('metadata', {}).get('billing', 'monthly')

        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
                days_key = f'premium_days_{billing}'
                days = PLAN_CONFIG.get(plan, {}).get(days_key, 30)
                user.is_premium = True
                user.premium_until = timezone.now() + timedelta(days=days)
                user.save(update_fields=['is_premium', 'premium_until'])
            except User.DoesNotExist:
                pass

    elif event.type == 'customer.subscription.deleted':
        # Subscription canceled
        subscription = event.data.object
        customer_id = subscription.get('customer')
        if customer_id:
            try:
                customer = stripe.Customer.retrieve(customer_id)
                user = User.objects.get(email=customer.email)
                user.is_premium = False
                user.premium_until = None
                user.save(update_fields=['is_premium', 'premium_until'])
            except (User.DoesNotExist, stripe.error.StripeError):
                pass

    elif event.type == 'invoice.payment_succeeded':
        # Recurring payment - extend premium
        invoice = event.data.object
        customer_id = invoice.get('customer')
        if customer_id:
            try:
                customer = stripe.Customer.retrieve(customer_id)
                user = User.objects.get(email=customer.email)
                # Extend by 35 days (buffer for monthly) or 370 (annual)
                if user.premium_until and user.premium_until > timezone.now():
                    user.premium_until += timedelta(days=35)
                else:
                    user.premium_until = timezone.now() + timedelta(days=35)
                user.is_premium = True
                user.save(update_fields=['is_premium', 'premium_until'])
            except (User.DoesNotExist, stripe.error.StripeError):
                pass

    return HttpResponse(status=200)
