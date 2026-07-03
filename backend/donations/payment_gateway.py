"""Mock payment gateway simulating M-Pesa STK Push and Card authorization.

In production, this would call real payment provider APIs (e.g., Safaricom
Daraja API for M-Pesa, Stripe/PayPal for cards). Here we simulate responses
for testing and development.
"""
import random
import time
from datetime import datetime


def _generate_txn_id():
    """Generate a unique-looking transaction ID."""
    now = datetime.now().strftime("%Y%m%d%H%M%S")
    rand = random.randint(10000, 99999)
    return f"TXN-{now}-{rand}"


def simulate_mpesa(phone_number: str, amount: float) -> dict:
    """Simulate M-Pesa STK Push payment.

    Returns:
        dict: {success: bool, transaction_id: str, message: str}
    """
    # Simulate network delay
    time.sleep(1.5)

    # Simulate payment result (60% success rate)
    success = random.random() < 0.6

    if success:
        return {
            "success": True,
            "transaction_id": _generate_txn_id(),
            "message": f"M-Pesa payment of {amount} confirmed. STK Push accepted on {phone_number}.",
            "gateway": "M-Pesa",
        }
    else:
        return {
            "success": False,
            "transaction_id": _generate_txn_id(),
            "message": f"M-Pesa payment failed. Insufficient funds or user cancelled on {phone_number}.",
            "gateway": "M-Pesa",
        }


def simulate_card(card_number: str, amount: float) -> dict:
    """Simulate card payment authorization.

    Returns:
        dict: {success: bool, transaction_id: str, message: str}
    """
    # Simulate network delay
    time.sleep(1.5)

    # Simple validation: test cards (4242424242424242) always succeed
    test_card = "4242424242424242"
    if card_number.replace(" ", "").replace("-", "") == test_card:
        return {
            "success": True,
            "transaction_id": _generate_txn_id(),
            "message": f"Card payment of {amount} authorized successfully. Test card accepted.",
            "gateway": "Card",
        }

    # Simulate payment result (60% success rate for real cards)
    success = random.random() < 0.6

    if success:
        return {
            "success": True,
            "transaction_id": _generate_txn_id(),
            "message": f"Card payment of {amount} authorized successfully.",
            "gateway": "Card",
        }
    else:
        return {
            "success": False,
            "transaction_id": _generate_txn_id(),
            "message": "Card payment declined. Please check your card details and try again.",
            "gateway": "Card",
        }