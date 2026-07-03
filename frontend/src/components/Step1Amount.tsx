import { useState } from "react";
import type { DonationPayload } from "../api";

interface Step1Props {
  data: DonationPayload;
  onChange: (d: DonationPayload) => void;
  onNext: () => void;
}

const PURPOSES = ["General Fund", "Education", "Healthcare", "Environment", "Emergency Relief"];

export default function Step1Amount({ data, onChange, onNext }: Step1Props) {
  const [error, setError] = useState<string | null>(null);
  const presets = [500, 1000, 2500, 5000, 10000];

  const validate = () => {
    if (!data.donor_name.trim()) return "Full name is required";
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      return "Valid email is required";
    if (!data.phone_number || data.phone_number.replace(/\D/g, "").length < 10)
      return "Valid phone number is required";
    if (data.amount <= 0) return "Please enter an amount";
    return null;
  };

  const handleNext = () => {
    const err = validate();
    setError(err);
    if (!err) onNext();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose an amount</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {presets.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onChange({ ...data, amount: amt })}
              className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                data.amount === amt
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
            >
              KES {amt.toLocaleString()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...data, amount: 0 })}
            className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
              !presets.includes(data.amount)
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-700 hover:border-gray-400"
            }`}
          >
            Custom
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 font-medium">KES</span>
          <input
            type="number"
            value={data.amount || ""}
            onChange={(e) => onChange({ ...data, amount: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min={1}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-400">Min KES 1</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your information</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="donor_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              id="donor_name"
              type="text"
              value={data.donor_name}
              onChange={(e) => onChange({ ...data, donor_name: e.target.value })}
              placeholder="Jane Wanjiiku"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              placeholder="jane@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={data.phone_number}
              onChange={(e) => onChange({ ...data, phone_number: e.target.value })}
              placeholder="+254 7XX XXX XXX"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Donation purpose <span className="text-gray-400">(optional)</span>
            </label>
            <select
              id="purpose"
              value={data.message || ""}
              onChange={(e) => onChange({ ...data, message: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 border border-red-200">
          {error}
        </div>
      )}

      <button
        onClick={handleNext}
        className="w-full rounded-md bg-blue-600 py-2.5 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Continue to Payment →
      </button>
    </div>
  );
}
