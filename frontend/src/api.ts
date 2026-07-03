import axios from "axios";

// Single source of truth for the backend origin. Used for the API base URL
// (below) and the Django admin link in App.tsx, so the origin lives in one place.
export const API_ORIGIN = "https://donation-demo-app.maunode.com";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  headers: { "Content-Type": "application/json" },
});

export interface Donation {
  id: number;
  donor_name: string;
  email: string;
  amount: string;
  currency: string;
  payment_method: "mpesa" | "card";
  phone_number: string | null;
  card_last_four: string | null;
  card_expiry: string | null;
  payment_status: "initiated" | "success" | "failed";
  transaction_id: string | null;
  payment_message: string | null;
  message: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  payment_result: {
    status: string;
    transaction_id: string | null;
    message: string | null;
    processed_at: string | null;
  };
}

export interface DonationSummary {
  total_donations: number;
  successful_donations: number;
  total_amount: string;
  by_currency: { currency: string; total: string; count: number }[];
  by_payment_method: { payment_method: string; count: number; total: string }[];
}

export interface DonationPayload {
  donor_name: string;
  email: string;
  amount: number;
  currency: string;
  payment_method: "mpesa" | "card";
  phone_number?: string;
  card_number?: string;
  card_expiry?: string;
  message?: string;
}

export interface PaginatedDonations {
  count: number;
  next: string | null;
  previous: string | null;
  results: Donation[];
}

export async function getDonations(): Promise<PaginatedDonations> {
  const { data } = await api.get<PaginatedDonations>("/donations/");
  return data;
}

export async function getDonationSummary(): Promise<DonationSummary> {
  const { data } = await api.get<DonationSummary>("/donations/summary/");
  return data;
}

export async function createDonation(payload: DonationPayload): Promise<Donation> {
  const { data } = await api.post<Donation>("/donations/", payload);
  return data;
}

export async function retryDonation(id: number, card_number?: string): Promise<Donation> {
  const { data } = await api.post<Donation>(`/donations/${id}/retry/`, card_number ? { card_number } : {});
  return data;
}
