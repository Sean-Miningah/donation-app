import type { Donation } from "../api";
import { CheckCircle } from "lucide-react";

interface Step4Props {
  donation: Donation;
  onReset: () => void;
}

export default function Step4Success({ donation, onReset }: Step4Props) {
  const date = new Date(donation.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="mb-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Thank you!</h2>
        <p className="text-sm text-gray-600 mt-1">
          Your donation of {donation.currency} {parseFloat(donation.amount).toLocaleString()} has been received.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 text-left">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reference</span>
            <span className="font-mono font-medium text-gray-900">{donation.transaction_id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-900">{date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium text-gray-900">
              {donation.currency} {parseFloat(donation.amount).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Method</span>
            <span className="font-medium text-gray-900 capitalize">
              {donation.payment_method === "mpesa" ? "M-Pesa" : "Card"}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-6 rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Make Another Donation
      </button>
    </div>
  );
}
