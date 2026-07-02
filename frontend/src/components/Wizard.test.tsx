import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import * as api from "../api";

vi.mock("../api");
vi.mock("./DonationsList", () => ({
  default: () => <div data-testid="donations-list">Donations List</div>,
}));

describe("Donation Wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders step 1 with amount selection and donor info", () => {
    render(<App />);
    expect(screen.getByText("Make a Difference Today")).toBeInTheDocument();
    expect(screen.getByText("Choose an amount")).toBeInTheDocument();
    expect(screen.getByText("Your information")).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone number/i)).toBeInTheDocument();
  });

  it("shows stepper with 3 steps", () => {
    render(<App />);
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("advances to step 2 when Continue is clicked with valid data", async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full name/i), "Jane Wanjiku");
    await user.type(screen.getByLabelText(/Email address/i), "jane@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "+254712345678");

    await user.click(screen.getByRole("button", { name: /Continue to Payment/i }));

    await waitFor(() => {
      expect(screen.getByText("Choose payment method")).toBeInTheDocument();
    });
  });

  it("shows M-Pesa option selected by default in step 2", async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full name/i), "Jane");
    await user.type(screen.getByLabelText(/Email address/i), "j@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "+254712345678");
    await user.click(screen.getByRole("button", { name: /Continue to Payment/i }));

    await waitFor(() => {
      expect(screen.getByText(/M-Pesa phone number/i)).toBeInTheDocument();
    });
  });

  it("shows card fields when Card is selected in step 2", async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full name/i), "Jane");
    await user.type(screen.getByLabelText(/Email address/i), "j@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "+254712345678");
    await user.click(screen.getByRole("button", { name: /Continue to Payment/i }));

    await waitFor(() => {
      expect(screen.getByText("Choose payment method")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Card/i }));

    expect(screen.getByLabelText(/Card number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expiry date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CVV/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cardholder name/i)).toBeInTheDocument();
  });

  it("advances to step 3 review after selecting payment method", async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full name/i), "Jane Wanjiku");
    await user.type(screen.getByLabelText(/Email address/i), "jane@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "+254712345678");
    await user.click(screen.getByRole("button", { name: /Continue to Payment/i }));

    await waitFor(() => {
      expect(screen.getByText("Choose payment method")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Review Donation/i }));

    await waitFor(() => {
      expect(screen.getByText("Review your donation")).toBeInTheDocument();
    });
  });

  it("shows security note on review step", async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full name/i), "Jane");
    await user.type(screen.getByLabelText(/Email address/i), "j@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "+254712345678");
    await user.click(screen.getByRole("button", { name: /Continue to Payment/i }));
    await waitFor(() => expect(screen.getByText("Choose payment method")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Review Donation/i }));

    await waitFor(() => {
      expect(screen.getByText(/256-bit encryption/i)).toBeInTheDocument();
    });
  });

  it("shows success screen after confirming donation", async () => {
    vi.mocked(api.createDonation).mockResolvedValue({
      id: 1,
      donor_name: "Jane Wanjiku",
      email: "jane@example.com",
      amount: "500.00",
      currency: "KES",
      payment_method: "mpesa",
      phone_number: "+254712345678",
      card_last_four: null,
      card_expiry: null,
      payment_status: "success",
      transaction_id: "DN-001",
      payment_message: "OK",
      message: "General Fund",
      processed_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      payment_result: {
        status: "success",
        transaction_id: "DN-001",
        message: "OK",
        processed_at: "2026-01-01T00:00:00Z",
      },
    });

    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full name/i), "Jane Wanjiku");
    await user.type(screen.getByLabelText(/Email address/i), "jane@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "+254712345678");
    await user.click(screen.getByRole("button", { name: /Continue to Payment/i }));

    await waitFor(() => expect(screen.getByText("Choose payment method")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Review Donation/i }));

    await waitFor(() => expect(screen.getByText("Review your donation")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Confirm Donation/i }));

    await waitFor(() => {
      expect(screen.getByText("Thank you!")).toBeInTheDocument();
    });
    expect(screen.getByText(/DN-001/i)).toBeInTheDocument();
  });

  it("can go back from step 2 to step 1", async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full name/i), "Jane");
    await user.type(screen.getByLabelText(/Email address/i), "j@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "+254712345678");
    await user.click(screen.getByRole("button", { name: /Continue to Payment/i }));

    await waitFor(() => expect(screen.getByText("Choose payment method")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Back/i }));

    expect(screen.getByText("Choose an amount")).toBeInTheDocument();
  });
});