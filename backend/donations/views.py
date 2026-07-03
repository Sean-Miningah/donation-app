from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, OpenApiExample, inline_serializer
from rest_framework import serializers as drf_serializers
from .models import Donation
from .serializers import DonationSerializer
from .payment_gateway import simulate_mpesa, simulate_card


class DonationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for donations with payment processing.

    * **POST** `/api/donations/` — create a new donation and process payment
    * **GET** `/api/donations/` — list all donations (paginated)
    * **GET** `/api/donations/{id}/` — retrieve a single donation
    * **POST** `/api/donations/{id}/retry/` — retry a failed payment
    * **GET** `/api/donations/summary/` — aggregate donation statistics
    """

    queryset = Donation.objects.all()
    serializer_class = DonationSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    @extend_schema(
        summary="Create a donation",
        description="Submit a new donation. The backend creates the record with status=INITIATED, calls the mock payment gateway, and returns the record with the final SUCCESS or FAILED status.",
        request=DonationSerializer,
        responses={
            201: DonationSerializer,
            200: DonationSerializer,
            400: DonationSerializer,
        },
        examples=[
            OpenApiExample(
                "M-Pesa donation",
                value={
                    "donor_name": "Jane Wanjiku",
                    "email": "jane@example.com",
                    "amount": 500,
                    "currency": "KES",
                    "payment_method": "mpesa",
                    "phone_number": "+254712345678",
                    "message": "Education",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Card donation",
                value={
                    "donor_name": "John Doe",
                    "email": "john@example.com",
                    "amount": 100,
                    "currency": "USD",
                    "payment_method": "card",
                    "card_number": "4242424242424242",
                    "card_expiry": "12/2028",
                    "message": "Healthcare",
                },
                request_only=True,
            ),
        ],
    )
    def create(self, request, *args, **kwargs):
        """Create donation and immediately process payment."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Extract card number before saving (write-only, never stored full)
        card_number = serializer.validated_data.pop("card_number", None)

        # Save with initiated status
        donation = serializer.save(
            payment_status="initiated",
            transaction_id=None,
            payment_message=None,
            processed_at=None,
        )

        # Process payment through mock gateway
        result = self._process_payment(donation, card_number)

        # Refresh and return
        donation.refresh_from_db()
        response_serializer = self.get_serializer(donation)
        headers = self.get_success_headers(response_serializer.data)

        http_status = status.HTTP_201_CREATED if result["success"] else status.HTTP_200_OK
        return Response(response_serializer.data, status=http_status, headers=headers)

    def _process_payment(self, donation: Donation, card_number: str | None) -> dict:
        """Call the mock payment gateway and update donation status."""
        if donation.payment_method == "mpesa":
            result = simulate_mpesa(donation.phone_number, float(donation.amount))
        else:
            result = simulate_card(card_number or "", float(donation.amount))

        # Update donation record
        donation.payment_status = "success" if result["success"] else "failed"
        donation.transaction_id = result["transaction_id"]
        donation.payment_message = result["message"]
        donation.processed_at = timezone.now()

        # Extract last 4 digits for cards (never store full number)
        if donation.payment_method == "card" and card_number:
            donation.card_last_four = card_number.replace(" ", "").replace("-", "")[-4:]

        donation.save()
        return result

    @extend_schema(
        summary="Retry a failed donation",
        description="Reset a failed donation to INITIATED and re-process the payment. For card payments, the card number must be provided again since it is never stored.",
        request=inline_serializer(
            name="RetryPayload",
            fields={
                "card_number": drf_serializers.CharField(
                    required=False,
                    help_text="Required for card payments only. Full card number (write-only).",
                ),
            },
        ),
        responses={200: DonationSerializer},
        examples=[
            OpenApiExample(
                "Retry card payment",
                value={"card_number": "4242424242424242"},
                request_only=True,
            ),
        ],
    )
    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        """Retry a failed payment."""
        donation = self.get_object()

        if donation.payment_status != "failed":
            raise ValidationError(
                {"detail": "Only failed donations can be retried."}
            )

        # Reset to initiated and retry
        donation.payment_status = "initiated"
        donation.transaction_id = None
        donation.payment_message = None
        donation.processed_at = None
        donation.save()

        card_number = None
        if donation.payment_method == "card":
            # For retry, require card number again (we don't store it)
            card_number = request.data.get("card_number")
            if not card_number:
                raise ValidationError(
                    {"card_number": "Card number is required to retry card payment."}
                )

        result = self._process_payment(donation, card_number)

        donation.refresh_from_db()
        serializer = self.get_serializer(donation)
        return Response(serializer.data)

    @extend_schema(
        summary="Donation statistics",
        description="Return aggregate donation statistics including total donations, successful donations, total amount raised, and breakdowns by currency and payment method.",
        responses={
            200: inline_serializer(
                name="DonationSummary",
                fields={
                    "total_donations": drf_serializers.IntegerField(),
                    "successful_donations": drf_serializers.IntegerField(),
                    "total_amount": drf_serializers.DecimalField(max_digits=12, decimal_places=2),
                    "by_currency": drf_serializers.ListField(),
                    "by_payment_method": drf_serializers.ListField(),
                },
            )
        },
    )
    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Return aggregate donation statistics."""
        total_success = (
            Donation.objects.filter(payment_status="success")
            .aggregate(total=Sum("amount"))
        )
        count_success = Donation.objects.filter(payment_status="success").count()
        count_total = Donation.objects.count()
        by_currency = (
            Donation.objects.filter(payment_status="success")
            .values("currency")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("currency")
        )
        by_method = (
            Donation.objects.filter(payment_status="success")
            .values("payment_method")
            .annotate(count=Count("id"), total=Sum("amount"))
            .order_by("payment_method")
        )
        return Response(
            {
                "total_donations": count_total,
                "successful_donations": count_success,
                "total_amount": total_success["total"] or 0,
                "by_currency": list(by_currency),
                "by_payment_method": list(by_method),
            }
        )
