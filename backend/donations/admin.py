from django.contrib import admin
from .models import Donation


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = (
        "donor_name",
        "email",
        "amount",
        "currency",
        "payment_method",
        "payment_status",
        "transaction_id",
        "created_at",
    )
    list_filter = (
        "payment_method",
        "payment_status",
        "currency",
        "created_at",
    )
    search_fields = ("donor_name", "email", "phone_number", "transaction_id")
    readonly_fields = (
        "transaction_id",
        "payment_status",
        "payment_message",
        "processed_at",
        "created_at",
        "updated_at",
    )
    fieldsets = (
        (
            "Donor Information",
            {"fields": ("donor_name", "email", "message")},
        ),
        (
            "Payment Details",
            {
                "fields": (
                    "amount",
                    "currency",
                    "payment_method",
                    "phone_number",
                    "card_last_four",
                    "card_expiry",
                )
            },
        ),
        (
            "Payment Status",
            {
                "fields": (
                    "payment_status",
                    "transaction_id",
                    "payment_message",
                    "processed_at",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )
    date_hierarchy = "created_at"
    ordering = ("-created_at",)