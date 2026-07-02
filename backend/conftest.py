import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def valid_mpesa_payload():
    return {
        "donor_name": "John Doe",
        "email": "john@example.com",
        "amount": 50,
        "currency": "KES",
        "payment_method": "mpesa",
        "phone_number": "+254712345678",
    }


@pytest.fixture
def valid_card_payload():
    return {
        "donor_name": "Jane Smith",
        "email": "jane@example.com",
        "amount": 100,
        "currency": "USD",
        "payment_method": "card",
        "card_number": "4242424242424242",
        "card_expiry": "12/2028",
        "message": "Great cause!",
    }