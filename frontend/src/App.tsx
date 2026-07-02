import { useState } from "react";
import { Heart } from "lucide-react";
import Step1Amount from "./components/Step1Amount";
import Step2Payment from "./components/Step2Payment";
import Step3Review from "./components/Step3Review";
import Step4Success from "./components/Step4Success";
import DonationsList from "./components/DonationsList";
import type { DonationPayload, Donation } from "./api";

const defaultPayload: DonationPayload = {
  donor_name: "",
  email: "",
  amount: 500,
  currency: "KES",
  payment_method: "mpesa",
  phone_number: "",
  card_number: "",
  card_expiry: "",
  message: "General Fund",
};

function Stepper({ step }: { step: number }) {
  const steps = [
    { label: "Amount", num: 1 },
    { label: "Payment", num: 2 },
    { label: "Confirm", num: 3 },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                step > s.num
                  ? "bg-green-600 text-white"
                  : step === s.num
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </div>
            <span
              className={`text-xs font-medium ${
                step >= s.num ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-px ${
                step > s.num ? "bg-green-600" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [payload, setPayload] = useState<DonationPayload>(defaultPayload);
  const [donation, setDonation] = useState<Donation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reset = () => {
    setPayload(defaultPayload);
    setDonation(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">GiveNow</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {donation ? (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <Step4Success donation={donation} onReset={reset} />
            </div>
            <div key={refreshKey}>
              <DonationsList />
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Make a Difference Today
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Your contribution directly supports our community programs. Every amount counts.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div>
                <Stepper step={step} />
                {step === 1 && (
                  <Step1Amount
                    data={payload}
                    onChange={setPayload}
                    onNext={() => setStep(2)}
                  />
                )}
                {step === 2 && (
                  <Step2Payment
                    data={payload}
                    onChange={setPayload}
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                  />
                )}
                {step === 3 && (
                  <Step3Review
                    data={payload}
                    onBack={() => setStep(2)}
                    onSuccess={(d) => {
                      setDonation(d);
                      setRefreshKey((k) => k + 1);
                    }}
                  />
                )}
              </div>
              <div>
                <DonationsList />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
