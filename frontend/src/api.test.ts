import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock axios BEFORE importing the api module
vi.mock("axios", () => {
  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockClient),
    },
    __esModule: true,
  };
});

// Now import the api module (it will use the mocked axios)
import {
  getDonations,
  getDonationSummary,
  createDonation,
  retryDonation,
  type DonationPayload,
} from "./api";

// Import axios to access the mock
import axios from "axios";
const mockedAxios = axios as unknown as {
  create: () => { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
};
const mockClient = mockedAxios.create();

describe("API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.get.mockReset();
    mockClient.post.mockReset();
  });

  it("fetches donations list", async () => {
    const mockResponse = {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          donor_name: "Test",
          email: "test@example.com",
          amount: "50.00",
          currency: "KES",
          payment_method: "mpesa",
          phone_number: "+254712345678",
          card_last_four: null,
          card_expiry: null,
          payment_status: "success",
          transaction_id: "TXN-001",
          payment_message: "OK",
          message: null,
          processed_at: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          payment_result: {
            status: "success",
            transaction_id: "TXN-001",
            message: "OK",
            processed_at: null,
          },
        },
      ],
    };
    mockClient.get.mockResolvedValue({ data: mockResponse });

    const result = await getDonations();
    expect(mockClient.get).toHaveBeenCalledWith("/donations/");
    expect(result.count).toBe(1);
    expect(result.results[0].donor_name).toBe("Test");
  });

  it("fetches donation summary", async () => {
    const mockResponse = {
      total_donations: 5,
      successful_donations: 3,
      total_amount: "250.00",
      by_currency: [{ currency: "KES", total: "250.00", count: 3 }],
      by_payment_method: [
        { payment_method: "mpesa", count: 3, total: "250.00" },
      ],
    };
    mockClient.get.mockResolvedValue({ data: mockResponse });

    const result = await getDonationSummary();
    expect(mockClient.get).toHaveBeenCalledWith("/donations/summary/");
    expect(result.total_donations).toBe(5);
    expect(result.total_amount).toBe("250.00");
  });

  it("creates a donation with correct payload", async () => {
    const payload: DonationPayload = {
      donor_name: "John",
      email: "john@example.com",
      amount: 100,
      currency: "KES",
      payment_method: "mpesa",
      phone_number: "+254712345678",
    };
    const mockResponse = {
      id: 1,
      donor_name: "John",
      email: "john@example.com",
      amount: "100.00",
      currency: "KES",
      payment_method: "mpesa",
      phone_number: "+254712345678",
      card_last_four: null,
      card_expiry: null,
      payment_status: "success",
      transaction_id: "TXN-001",
      payment_message: "OK",
      message: null,
      processed_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      payment_result: {
        status: "success",
        transaction_id: "TXN-001",
        message: "OK",
        processed_at: "2026-01-01T00:00:00Z",
      },
    };
    mockClient.post.mockResolvedValue({ data: mockResponse });

    const result = await createDonation(payload);
    expect(mockClient.post).toHaveBeenCalledWith("/donations/", payload);
    expect(result.id).toBe(1);
    expect(result.payment_status).toBe("success");
  });

  it("retries a donation with correct ID", async () => {
    const mockResponse = {
      id: 1,
      donor_name: "John",
      email: "john@example.com",
      amount: "100.00",
      currency: "KES",
      payment_method: "mpesa",
      phone_number: "+254712345678",
      card_last_four: null,
      card_expiry: null,
      payment_status: "success",
      transaction_id: "TXN-RETRY",
      payment_message: "Retry OK",
      message: null,
      processed_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      payment_result: {
        status: "success",
        transaction_id: "TXN-RETRY",
        message: "Retry OK",
        processed_at: "2026-01-01T00:00:00Z",
      },
    };
    mockClient.post.mockResolvedValue({ data: mockResponse });

    const result = await retryDonation(1);
    expect(mockClient.post).toHaveBeenCalledWith("/donations/1/retry/", {});
    expect(result.payment_status).toBe("success");
  });

  it("retries a card donation with card number", async () => {
    const mockResponse = {
      id: 2,
      donor_name: "Jane",
      email: "jane@example.com",
      amount: "50.00",
      currency: "USD",
      payment_method: "card",
      phone_number: null,
      card_last_four: "4242",
      card_expiry: "12/2028",
      payment_status: "success",
      transaction_id: "TXN-CARD-RETRY",
      payment_message: "Card retry OK",
      message: null,
      processed_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      payment_result: {
        status: "success",
        transaction_id: "TXN-CARD-RETRY",
        message: "Card retry OK",
        processed_at: "2026-01-01T00:00:00Z",
      },
    };
    mockClient.post.mockResolvedValue({ data: mockResponse });

    const result = await retryDonation(2, "4242424242424242");
    expect(mockClient.post).toHaveBeenCalledWith("/donations/2/retry/", {
      card_number: "4242424242424242",
    });
    expect(result.payment_status).toBe("success");
  });
});