import { useEffect, useState } from "react";
import {
  Users,
  TrendingUp,
  Coins,
  RefreshCw,
  CreditCard,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  getDonations,
  getDonationSummary,
  type Donation,
  type DonationSummary,
} from "../api";

export default function DonationsList() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, s] = await Promise.all([getDonations(), getDonationSummary()]);
      setDonations(d.results);
      setSummary(s);
    } catch {
      setError("Failed to load donations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const methodIcon = (method: string) => {
    return method === "mpesa" ? (
      <Smartphone className="w-4 h-4 text-gray-500" />
    ) : (
      <CreditCard className="w-4 h-4 text-gray-500" />
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={refresh} className="font-medium underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}
      {/* Stats cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Total"
            value={String(summary.total_donations)}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Successful"
            value={String(summary.successful_donations)}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Raised"
            value={parseFloat(summary.total_amount).toLocaleString()}
            color="bg-amber-50 text-amber-600"
          />
          <StatCard
            icon={<Coins className="w-4 h-4" />}
            label="Currencies"
            value={String(summary.by_currency.length)}
            color="bg-violet-50 text-violet-600"
          />
        </div>
      )}

      {/* Donations table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Donations</h2>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-500 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-gray-400">
            Loading donations...
          </div>
        ) : donations.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">
            No donations yet. Be the first to contribute!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Donor</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {d.donor_name}
                      </div>
                      <div className="text-xs text-gray-400">{d.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        {methodIcon(d.payment_method)}
                        <span className="capitalize">
                          {d.payment_method === "mpesa"
                            ? "M-Pesa"
                            : "Card"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {d.currency}{" "}
                        {parseFloat(d.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${statusStyle(
                          d.payment_status
                        )}`}
                      >
                        {statusIcon(d.payment_status)}
                        {d.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-sm text-gray-400">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}