import uuid
from django.db import models


class Donation(models.Model):
    """A donation with payment processing."""

    PAYMENT_METHODS = [
        ("mpesa", "M-Pesa"),
        ("card", "Card"),
    ]

    PAYMENT_STATUS = [
        ("initiated", "Initiated"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    # Donor details
    donor_name = models.CharField(max_length=255)
    email = models.EmailField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")

    # Payment method
    payment_method = models.CharField(
        max_length=10, choices=PAYMENT_METHODS, default="mpesa"
    )

    # M-Pesa fields
    phone_number = models.CharField(
        max_length=20, blank=True, null=True,
        help_text="M-Pesa phone number (e.g. +254712345678)"
    )

    # Card fields (store only last 4 digits, never full card numbers)
    card_last_four = models.CharField(max_length=4, blank=True, null=True)
    card_expiry = models.CharField(
        max_length=7, blank=True, null=True,
        help_text="MM/YYYY"
    )

    # Payment processing
    payment_status = models.CharField(
        max_length=10, choices=PAYMENT_STATUS, default="initiated"
    )
    transaction_id = models.CharField(
        max_length=100, blank=True, null=True, unique=True
    )
    payment_message = models.TextField(
        blank=True, null=True,
        help_text="Response message from payment gateway"
    )
    processed_at = models.DateTimeField(blank=True, null=True)

    # Message
    message = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        status = self.get_payment_status_display()
        return f"{self.donor_name} — {self.amount} ({self.payment_method.upper()}) — {status}"