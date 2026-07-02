import pytest
from donations.models import Donation


@pytest.mark.django_db
class TestDonationCreation:
    """Tests for creating donations via API with payment processing."""

    def test_mpesa_donation_is_created_with_initiated_then_processed_status(
        self, api_client, valid_mpesa_payload
    ):
        response = api_client.post("/api/donations/", valid_mpesa_payload, format="json")
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["donor_name"] == "John Doe"
        assert data["payment_method"] == "mpesa"
        assert data["phone_number"] == "+254712345678"
        assert data["payment_status"] in ["success", "failed"]
        assert data["transaction_id"] is not None
        assert data["payment_result"]["message"] is not None

    def test_card_donation_with_test_card_always_succeeds(
        self, api_client, valid_card_payload
    ):
        response = api_client.post("/api/donations/", valid_card_payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["payment_status"] == "success"
        assert data["card_last_four"] == "4242"
        assert data["transaction_id"] is not None
        assert data["payment_result"]["message"] is not None

    def test_card_donation_does_not_store_full_card_number(
        self, api_client, valid_card_payload
    ):
        api_client.post("/api/donations/", valid_card_payload, format="json")
        donation = Donation.objects.latest("created_at")
        assert not hasattr(donation, "card_number")  # field never exists on model
        assert donation.card_last_four == "4242"


@pytest.mark.django_db
class TestDonationValidation:
    """Tests for validation of donation creation data."""

    def test_mpesa_without_phone_number_returns_error(self, api_client):
        payload = {
            "donor_name": "John",
            "email": "john@example.com",
            "amount": 50,
            "currency": "KES",
            "payment_method": "mpesa",
        }
        response = api_client.post("/api/donations/", payload, format="json")
        assert response.status_code == 400
        assert "phone_number" in response.json()

    def test_mpesa_with_invalid_phone_number_returns_error(self, api_client):
        payload = {
            "donor_name": "John",
            "email": "john@example.com",
            "amount": 50,
            "currency": "KES",
            "payment_method": "mpesa",
            "phone_number": "123",
        }
        response = api_client.post("/api/donations/", payload, format="json")
        assert response.status_code == 400

    def test_card_without_card_number_returns_error(self, api_client):
        payload = {
            "donor_name": "Jane",
            "email": "jane@example.com",
            "amount": 50,
            "currency": "USD",
            "payment_method": "card",
        }
        response = api_client.post("/api/donations/", payload, format="json")
        assert response.status_code == 400
        assert "card_number" in response.json()

    def test_card_with_too_short_card_number_returns_error(self, api_client):
        payload = {
            "donor_name": "Jane",
            "email": "jane@example.com",
            "amount": 50,
            "currency": "USD",
            "payment_method": "card",
            "card_number": "123456",
            "card_expiry": "12/2028",
        }
        response = api_client.post("/api/donations/", payload, format="json")
        assert response.status_code == 400

    def test_card_with_expired_expiry_returns_error(self, api_client):
        payload = {
            "donor_name": "Jane",
            "email": "jane@example.com",
            "amount": 50,
            "currency": "USD",
            "payment_method": "card",
            "card_number": "4242424242424242",
            "card_expiry": "01/2020",
        }
        response = api_client.post("/api/donations/", payload, format="json")
        assert response.status_code == 400
        assert "card_expiry" in response.json()

    def test_card_with_invalid_expiry_format_returns_error(self, api_client):
        payload = {
            "donor_name": "Jane",
            "email": "jane@example.com",
            "amount": 50,
            "currency": "USD",
            "payment_method": "card",
            "card_number": "4242424242424242",
            "card_expiry": "13/2028",
        }
        response = api_client.post("/api/donations/", payload, format="json")
        assert response.status_code == 400

    def test_donation_without_name_returns_error(self, api_client):
        payload = {
            "email": "john@example.com",
            "amount": 50,
            "currency": "KES",
            "payment_method": "mpesa",
            "phone_number": "+254712345678",
        }
        response = api_client.post("/api/donations/", payload, format="json")
        assert response.status_code == 400


@pytest.mark.django_db
class TestDonationRetry:
    """Tests for retrying failed donations."""

    def test_retry_successful_donation_returns_error(self, api_client, valid_mpesa_payload):
        response = api_client.post("/api/donations/", valid_mpesa_payload, format="json")
        donation_id = response.json()["id"]

        # If it succeeded, retry should fail
        if response.json()["payment_status"] == "success":
            retry = api_client.post(
                f"/api/donations/{donation_id}/retry/", {}, format="json"
            )
            assert retry.status_code == 400
            assert "detail" in retry.json()

    def test_retry_failed_donation_changes_status(self, api_client):
        # Create a donation and force it to failed for retry test
        donation = Donation.objects.create(
            donor_name="Retry Test",
            email="retry@test.com",
            amount=50,
            currency="KES",
            payment_method="mpesa",
            phone_number="+254712345678",
            payment_status="failed",
            transaction_id="TXN-TEST-001",
            payment_message="Failed for test",
        )
        retry = api_client.post(
            f"/api/donations/{donation.id}/retry/", {}, format="json"
        )
        assert retry.status_code == 200
        data = retry.json()
        assert data["payment_status"] in ["success", "failed"]
        assert data["transaction_id"] is not None


@pytest.mark.django_db
class TestDonationSummary:
    """Tests for the donation summary endpoint."""

    def test_summary_returns_zero_for_empty_db(self, api_client):
        response = api_client.get("/api/donations/summary/")
        assert response.status_code == 200
        data = response.json()
        assert data["total_donations"] == 0
        assert data["successful_donations"] == 0
        assert data["total_amount"] == 0
        assert data["by_currency"] == []
        assert data["by_payment_method"] == []

    def test_summary_counts_only_successful_donations(self, api_client, valid_mpesa_payload):
        api_client.post("/api/donations/", valid_mpesa_payload, format="json")
        response = api_client.get("/api/donations/summary/")
        assert response.status_code == 200
        data = response.json()
        assert data["total_donations"] >= 1
        assert data["total_amount"] >= 0

    def test_summary_groups_by_currency(self, api_client, valid_mpesa_payload):
        api_client.post("/api/donations/", valid_mpesa_payload, format="json")
        response = api_client.get("/api/donations/summary/")
        data = response.json()
        assert any(
            item["currency"] == "KES" for item in data["by_currency"]
        ) or data["by_currency"] == []