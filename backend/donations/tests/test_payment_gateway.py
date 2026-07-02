import pytest
from donations.payment_gateway import simulate_mpesa, simulate_card


class TestSimulateMpesa:
    """Tests for the M-Pesa mock payment gateway."""

    def test_returns_dict_with_success_transaction_id_message(self):
        result = simulate_mpesa("+254712345678", 50.0)
        assert isinstance(result, dict)
        assert "success" in result
        assert "transaction_id" in result
        assert "message" in result
        assert "gateway" in result
        assert result["gateway"] == "M-Pesa"
        assert result["transaction_id"].startswith("TXN-")

    def test_result_status_is_boolean(self):
        result = simulate_mpesa("+254712345678", 100.0)
        assert result["success"] in [True, False]

    def test_message_contains_phone_number(self):
        result = simulate_mpesa("+254712345678", 75.0)
        assert "+254712345678" in result["message"]

    def test_success_message_contains_amount(self):
        # M-Pesa has 80% success rate — try until we get a success
        for _ in range(20):
            result = simulate_mpesa("+254712345678", 75.0)
            if result["success"]:
                assert "75.0" in result["message"]
                break
        else:
            pytest.skip("Could not observe a success in 20 attempts")


class TestSimulateCard:
    """Tests for the Card mock payment gateway."""

    def test_test_card_always_succeeds(self):
        result = simulate_card("4242424242424242", 100.0)
        assert result["success"] is True
        assert "Test card accepted" in result["message"]

    def test_test_card_with_spaces_and_dashes(self):
        result = simulate_card("4242-4242-4242-4242", 50.0)
        assert result["success"] is True

    def test_other_card_returns_result_with_fields(self):
        result = simulate_card("4111111111111111", 25.0)
        assert isinstance(result, dict)
        assert "success" in result
        assert "transaction_id" in result
        assert "message" in result
        assert result["gateway"] == "Card"

    def test_message_contains_amount_for_success(self):
        # Run multiple times since there's randomness
        for _ in range(10):
            result = simulate_card("4111111111111111", 50.0)
            if result["success"]:
                assert "50.0" in result["message"]
                break
        else:
            pytest.skip("Could not observe a success in 10 attempts")