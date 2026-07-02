import { useState } from "react";
import type { DonationPayload, Donation } from "../api";
import { ChevronLeft, Lock, Loader2 } from "lucide-react";
import { createDonation } from "../api";

interface Step3Props {
  data: DonationPayload;
  onBack: () => void;
  onSuccess: (donation: Donation) => void;
}

export default function Step3Review({ data, onBack, onSuccess }: Step3Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...data };
      if (payload.payment_method === "mpesa") {
        const digits = (payload.phone_number || "").replace(/\D/g, "");
        payload.phone_number = digits.startsWith("+") ? digits : "+" + digits;
      } else {
        payload.card_number = (payload.card_number || "").replace(/\s/g, "");
      }
      const result = await createDonation(payload);
      onSuccess(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const maskedCard = () => {
    const num = (data.card_number || "").replace(/\s/g, "");
    if (num.length > 4) return "**** " + num.slice(-4);
    return data.card_number || "";
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Review your donation</h2>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Donor</span>
            <span className="font-medium text-gray-900">{data.donor_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{data.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Purpose</span>
            <span className="font-medium text-gray-900">{data.message || "General Fund"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment</span>
            <span className="font-medium text-gray-900 capitalize">
              {data.payment_method === "mpesa" ? "M-Pesa" : "Card"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phone / Card</span>
            <span className="font-medium text-gray-900 font-mono">
              {data.payment_method === "mpesa"
                ? data.phone_number
                : maskedCard()}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-blue-600">
                KES {data.amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
        <Lock className="w-3.5 h-3.5" />
        Your payment is secured with 256-bit encryption. We never store your full card or M-Pesa PIN details.
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-5 py-2.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 rounded-md bg-green-600 py-2.5 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Confirm Donation"
          )}
        </button>
      </div>
    </div>
  );
}
