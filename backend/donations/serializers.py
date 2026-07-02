import re
from datetime import datetime
from rest_framework import serializers
from .models import Donation


class DonationSerializer(serializers.ModelSerializer):
    """Serializer for the Donation model with payment processing.

    Full card numbers are accepted in input but only last 4 digits are stored.
    The backend never persists full card numbers.
    """

    card_number = serializers.CharField(
        write_only=True, required=False, allow_blank=True,
        help_text="Full card number (not stored, only last 4 digits kept)"
    )
    payment_result = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = [
            "id",
            "donor_name",
            "email",
            "amount",
            "currency",
            "payment_method",
            "phone_number",
            "card_number",
            "card_last_four",
            "card_expiry",
            "payment_status",
            "transaction_id",
            "payment_message",
            "message",
            "processed_at",
            "created_at",
            "updated_at",
            "payment_result",
        ]
        read_only_fields = [
            "id",
            "card_last_four",
            "payment_status",
            "transaction_id",
            "payment_message",
            "processed_at",
            "created_at",
            "updated_at",
            "payment_result",
        ]

    def get_payment_result(self, obj: Donation) -> dict:
        return {
            "status": obj.payment_status,
            "transaction_id": obj.transaction_id,
            "message": obj.payment_message,
            "processed_at": obj.processed_at,
        }

    def validate(self, data):
        """Validate payment method specific fields."""
        method = data.get("payment_method")

        if method == "mpesa":
            phone = data.get("phone_number")
            if not phone:
                raise serializers.ValidationError(
                    {"phone_number": "Phone number is required for M-Pesa payments."}
                )
            cleaned = re.sub(r"[^\d+]", "", phone)
            if len(cleaned) < 10:
                raise serializers.ValidationError(
                    {"phone_number": "Please enter a valid phone number."}
                )
            data["phone_number"] = cleaned

        elif method == "card":
            card_number = data.get("card_number")
            card_expiry = data.get("card_expiry")
            if not card_number:
                raise serializers.ValidationError(
                    {"card_number": "Card number is required for card payments."}
                )
            if not card_expiry:
                raise serializers.ValidationError(
                    {"card_expiry": "Card expiry date is required for card payments."}
                )

            cleaned = re.sub(r"[^\d]", "", card_number)
            if len(cleaned) < 13 or len(cleaned) > 19:
                raise serializers.ValidationError(
                    {"card_number": "Please enter a valid card number."}
                )

            if not re.match(r"^(0[1-9]|1[0-2])/(\d{4})$", card_expiry):
                raise serializers.ValidationError(
                    {"card_expiry": "Expiry must be in MM/YYYY format."}
                )
            month, year = card_expiry.split("/")
            expiry = datetime(int(year), int(month), 1)
            now = datetime.now()
            if expiry.year < now.year or (expiry.year == now.year and expiry.month < now.month):
                raise serializers.ValidationError(
                    {"card_expiry": "Card has expired."}
                )

        return data