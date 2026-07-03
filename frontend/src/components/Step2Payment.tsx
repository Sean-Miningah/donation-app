import { useState } from "react";
import type { DonationPayload } from "../api";
import { Smartphone, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";

interface Step2Props {
  data: DonationPayload;
  onChange: (d: DonationPayload) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Payment({ data, onChange, onNext, onBack }: Step2Props) {
  const [method, setMethod] = useState<"mpesa" | "card">(data.payment_method || "mpesa");
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    if (method === "mpesa") {
      if (!data.phone_number || data.phone_number.replace(/\D/g, "").length < 10) {
        setError("Valid M-Pesa phone number is required");
        return;
      }
    } else {
      if (!data.card_number || data.card_number.replace(/\s/g, "").length < 13) {
        setError("Valid card number is required");
        return;
      }
      if (!data.card_expiry || !/^(0[1-9]|1[0-2])\/\d{4}$/.test(data.card_expiry)) {
        setError("Valid expiry date (MM/YYYY) is required");
        return;
      }
    }
    onChange({ ...data, payment_method: method });
    onNext();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose payment method</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setMethod("mpesa")}
            className={`rounded-lg border p-5 text-center transition-colors ${
              method === "mpesa"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-5 h-5" />
            </div>
            <p className="font-medium text-gray-900">M-Pesa</p>
            <p className="text-xs text-gray-500 mt-1">STK push to your phone</p>
          </button>

          <button
            type="button"
            onClick={() => setMethod("card")}
            className={`rounded-lg border p-5 text-center transition-colors ${
              method === "card"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mx-auto mb-2">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="font-medium text-gray-900">Card</p>
            <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, or debit card</p>
          </button>
        </div>

        {method === "mpesa" ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="mpesa_phone" className="block text-sm font-medium text-gray-700 mb-1">
                M-Pesa phone number
              </label>
              <input
                id="mpesa_phone"
                type="tel"
                value={data.phone_number || ""}
                onChange={(e) => onChange({ ...data, phone_number: e.target.value })}
                placeholder="+254 7XX XXX XXX"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                You'll receive an STK push notification to confirm the payment.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border border-gray-200 rounded-md p-3">
                <p className="text-xs font-semibold text-blue-600 mb-1">Step 1</p>
                <p className="text-xs text-gray-600">Enter your M-Pesa number</p>
              </div>
              <div className="border border-gray-200 rounded-md p-3">
                <p className="text-xs font-semibold text-blue-600 mb-1">Step 2</p>
                <p className="text-xs text-gray-600">Receive STK push on your phone</p>
              </div>
              <div className="border border-gray-200 rounded-md p-3">
                <p className="text-xs font-semibold text-blue-600 mb-1">Step 3</p>
                <p className="text-xs text-gray-600">Enter M-Pesa PIN to confirm</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
                Card number
              </label>
              <input
                id="card_number"
                type="text"
                value={data.card_number || ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();
                  onChange({ ...data, card_number: v });
                }}
                placeholder="1234 5678 9012 3456"
                maxLength={23}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry date
              </label>
              <input
                id="expiry"
                type="text"
                value={data.card_expiry || ""}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 6);
                  onChange({ ...data, card_expiry: v });
                }}
                placeholder="MM/YYYY"
                maxLength={7}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 rounded-md bg-blue-600 py-2.5 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
        >
          Review Donation <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
