import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DonationsList from "./DonationsList";
import * as api from "../api";

vi.mock("../api");

describe("DonationsList", () => {
  const mockDonations = [
    {
      id: 1,
      donor_name: "Alice",
      email: "alice@example.com",
      amount: "100.00",
      currency: "KES",
      payment_method: "mpesa" as const,
      phone_number: "+254712345678",
      card_last_four: null,
      card_expiry: null,
      payment_status: "success" as const,
      transaction_id: "TXN-001",
      payment_message: "Confirmed",
      message: "Great cause!",
      processed_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      payment_result: {
        status: "success",
        transaction_id: "TXN-001",
        message: "Confirmed",
        processed_at: "2026-01-01T00:00:00Z",
      },
    },
    {
      id: 2,
      donor_name: "Bob",
      email: "bob@example.com",
      amount: "50.00",
      currency: "USD",
      payment_method: "card" as const,
      phone_number: null,
      card_last_four: "4242",
      card_expiry: "12/2028",
      payment_status: "failed" as const,
      transaction_id: "TXN-FAIL",
      payment_message: "Declined",
      message: null,
      processed_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      payment_result: {
        status: "failed",
        transaction_id: "TXN-FAIL",
        message: "Declined",
        processed_at: "2026-01-01T00:00:00Z",
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    vi.mocked(api.getDonations).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );
    vi.mocked(api.getDonationSummary).mockImplementation(
      () => new Promise(() => {})
    );

    render(<DonationsList />);
    expect(screen.getByText(/Loading donations/i)).toBeInTheDocument();
  });

  it("renders stats cards and donation table after loading", async () => {
    vi.mocked(api.getDonations).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockDonations,
    });
    vi.mocked(api.getDonationSummary).mockResolvedValue({
      total_donations: 2,
      successful_donations: 1,
      total_amount: "100.00",
      by_currency: [{ currency: "KES", total: "100.00", count: 1 }],
      by_payment_method: [
        { payment_method: "mpesa", count: 1, total: "100.00" },
        { payment_method: "card", count: 0, total: "0.00" },
      ],
    });

    render(<DonationsList />);

    await waitFor(() => {
      expect(screen.getByText("Alice", { exact: true })).toBeInTheDocument();
    });

    expect(screen.getByText(/Total/i)).toBeInTheDocument();
    expect(screen.getByText(/Successful/i)).toBeInTheDocument();
    expect(screen.getByText(/Raised/i)).toBeInTheDocument();
    expect(screen.getByText(/Currencies/i)).toBeInTheDocument();

    expect(screen.getByText("Bob", { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/KES 100/i)).toBeInTheDocument();
    expect(screen.getByText(/USD 50/i)).toBeInTheDocument();
  });

  it("shows empty state when no donations exist", async () => {
    vi.mocked(api.getDonations).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    vi.mocked(api.getDonationSummary).mockResolvedValue({
      total_donations: 0,
      successful_donations: 0,
      total_amount: "0.00",
      by_currency: [],
      by_payment_method: [],
    });

    render(<DonationsList />);

    await waitFor(() => {
      expect(screen.getByText(/No donations yet/i)).toBeInTheDocument();
    });
  });

  it("refreshes data when refresh button is clicked", async () => {
    vi.mocked(api.getDonations).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockDonations[0]],
    });
    vi.mocked(api.getDonationSummary).mockResolvedValue({
      total_donations: 1,
      successful_donations: 1,
      total_amount: "100.00",
      by_currency: [{ currency: "KES", total: "100.00", count: 1 }],
      by_payment_method: [
        { payment_method: "mpesa", count: 1, total: "100.00" },
      ],
    });

    render(<DonationsList />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Alice", { exact: true })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Refresh/i }));

    await waitFor(() => {
      expect(api.getDonations).toHaveBeenCalledTimes(2);
    });
  });

  it("renders payment status badges correctly", async () => {
    vi.mocked(api.getDonations).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockDonations,
    });
    vi.mocked(api.getDonationSummary).mockResolvedValue({
      total_donations: 2,
      successful_donations: 1,
      total_amount: "100.00",
      by_currency: [{ currency: "KES", total: "100.00", count: 1 }],
      by_payment_method: [
        { payment_method: "mpesa", count: 1, total: "100.00" },
        { payment_method: "card", count: 0, total: "0.00" },
      ],
    });

    render(<DonationsList />);

    await waitFor(() => {
      expect(screen.getAllByText("success", { exact: true })).toHaveLength(1);
    });
    expect(screen.getAllByText("failed", { exact: true })).toHaveLength(1);
  });

  it("renders payment method icons", async () => {
    vi.mocked(api.getDonations).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockDonations,
    });
    vi.mocked(api.getDonationSummary).mockResolvedValue({
      total_donations: 2,
      successful_donations: 1,
      total_amount: "100.00",
      by_currency: [{ currency: "KES", total: "100.00", count: 1 }],
      by_payment_method: [],
    });

    render(<DonationsList />);

    await waitFor(() => {
      expect(screen.getByText(/M-Pesa/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Card/i)).toBeInTheDocument();
  });
});