import pytest
from donations.models import Donation


@pytest.mark.django_db
class TestDonationModel:
    """Tests for the Donation model."""

    def test_donation_can_be_created_with_mpesa(self):
        donation = Donation.objects.create(
            donor_name="John Doe",
            email="john@example.com",
            amount=100,
            currency="KES",
            payment_method="mpesa",
            phone_number="+254712345678",
            payment_status="success",
        )
        assert donation.id is not None
        assert donation.donor_name == "John Doe"
        assert donation.payment_method == "mpesa"
        assert donation.phone_number == "+254712345678"
        assert donation.payment_status == "success"

    def test_donation_can_be_created_with_card(self):
        donation = Donation.objects.create(
            donor_name="Jane Smith",
            email="jane@example.com",
            amount=50,
            currency="USD",
            payment_method="card",
            card_last_four="4242",
            card_expiry="12/2028",
            payment_status="success",
        )
        assert donation.id is not None
        assert donation.payment_method == "card"
        assert donation.card_last_four == "4242"
        assert donation.card_expiry == "12/2028"
        assert donation.phone_number is None

    def test_default_payment_status_is_initiated(self):
        donation = Donation.objects.create(
            donor_name="Test User",
            email="test@example.com",
            amount=10,
            currency="USD",
            payment_method="mpesa",
            phone_number="+254712345678",
        )
        assert donation.payment_status == "initiated"

    def test_str_representation(self):
        donation = Donation.objects.create(
            donor_name="Alice",
            email="alice@example.com",
            amount=25,
            currency="KES",
            payment_method="mpesa",
            phone_number="+254712345678",
            payment_status="success",
        )
        assert "Alice" in str(donation)
        assert "MPESA" in str(donation)
        assert "Success" in str(donation)

    def test_ordering_by_created_at_desc(self):
        d1 = Donation.objects.create(
            donor_name="First", email="f@example.com", amount=10,
            currency="USD", payment_method="mpesa", phone_number="+254700000001",
            payment_status="success",
        )
        d2 = Donation.objects.create(
            donor_name="Second", email="s@example.com", amount=20,
            currency="USD", payment_method="mpesa", phone_number="+254700000002",
            payment_status="success",
        )
        donations = list(Donation.objects.all())
        assert donations[0] == d2
        assert donations[1] == d1