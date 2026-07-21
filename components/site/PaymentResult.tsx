"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { CheckCircle2, XCircle, Clock, AlertTriangle, HelpCircle } from "lucide-react";

interface PaymentStatusResponse {
  status: "success" | "pending" | "failed" | "cancelled" | "amount_mismatch" | "not_found";
  gateway?: string;
  amount?: number;
  transaction_id?: string | null;
  completed_at?: string | null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center gap-4">
        {children}
      </div>
      <Footer />
    </>
  );
}

/**
 * Shared by /payment/success and /payment/failed — deliberately ignorant of
 * which URL it was rendered from. The gateway redirect decides /success vs
 * /failed based on its own callback, which is not something to trust
 * blindly; this always re-verifies via GET /payment/status (server truth)
 * before showing anything, so a shopper never sees "Payment Successful"
 * because of the URL alone.
 */
export function PaymentResult() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";
  const orderId = searchParams.get("order_id") ?? "";
  const urlGateway = searchParams.get("gateway") ?? "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentStatusResponse | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  async function loadStatus() {
    if (!orderId) {
      setResult({ status: "not_found" });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/status?order_id=${encodeURIComponent(orderId)}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      setResult(res.ok ? (data as PaymentStatusResponse) : { status: "not_found" });
    } catch {
      setResult({ status: "not_found" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function handleRetry() {
    if (!orderId) return;
    setRetrying(true);
    setRetryError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          order_id: Number(orderId),
          gateway: result?.gateway || urlGateway,
        }),
      });
      const data = await res.json();
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      setRetryError(data.message ?? "Could not restart payment. Please try again.");
    } catch {
      setRetryError("Network error. Please try again.");
    } finally {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="animate-pulse text-gray-400 text-sm">Verifying your payment…</div>
      </Shell>
    );
  }

  const status = result?.status ?? "not_found";

  if (status === "success") {
    return (
      <Shell>
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-black">Payment Successful!</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Your payment has been confirmed and your order is being processed.
        </p>
        {orderNumber && (
          <p className="text-gray-500 text-sm mb-2">Order ID: <strong>{orderNumber}</strong></p>
        )}
        <div className="flex gap-3 mt-2">
          <Link href="/" className="border border-gray-200 px-6 py-2.5 text-sm font-bold rounded hover:border-black transition">Home</Link>
          <Link href="/shop" className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:bg-gray-800 transition">Continue Shopping</Link>
        </div>
      </Shell>
    );
  }

  if (status === "amount_mismatch") {
    return (
      <Shell>
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-black">We&apos;re Reviewing Your Payment</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          We received a payment for order <strong>{orderNumber}</strong>, but the amount needs
          manual confirmation before your order can be marked paid. This is not a failure —
          our team will verify it shortly. No need to pay again.
        </p>
        <div className="flex gap-3 mt-2">
          <Link href="/" className="border border-gray-200 px-6 py-2.5 text-sm font-bold rounded hover:border-black transition">Home</Link>
          <Link href="/contact" className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:bg-gray-800 transition">Contact Support</Link>
        </div>
      </Shell>
    );
  }

  if (status === "pending") {
    return (
      <Shell>
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
          <Clock className="h-10 w-10 text-blue-500" />
        </div>
        <h2 className="text-2xl font-black">Payment Processing</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          We&apos;re still waiting for confirmation from the payment gateway for order{" "}
          <strong>{orderNumber}</strong>. This page will not update automatically — check back
          shortly.
        </p>
        <button onClick={loadStatus} className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:bg-gray-800 transition">
          Check Again
        </button>
      </Shell>
    );
  }

  if (status === "failed" || status === "cancelled") {
    return (
      <Shell>
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black">
          {status === "cancelled" ? "Payment Cancelled" : "Payment Failed"}
        </h2>
        <p className="text-gray-500 text-sm max-w-sm">
          {orderNumber ? (
            <>Your order <strong>{orderNumber}</strong> was created but the payment didn&apos;t go through.</>
          ) : (
            "The payment didn't go through."
          )}{" "}
          You can try again below.
        </p>
        {retryError && <p className="text-red-500 text-xs">{retryError}</p>}
        <div className="flex gap-3 mt-2">
          <Link href="/checkout" className="border border-gray-200 px-6 py-2.5 text-sm font-bold rounded hover:border-black transition">
            Place a New Order
          </Link>
          {orderId && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:bg-gray-800 transition disabled:opacity-50"
            >
              {retrying ? "Redirecting…" : "Retry Payment"}
            </button>
          )}
        </div>
      </Shell>
    );
  }

  // not_found — no transaction on record, or the order/order_id was missing/invalid.
  return (
    <Shell>
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
        <HelpCircle className="h-10 w-10 text-gray-400" />
      </div>
      <h2 className="text-2xl font-black">We Couldn&apos;t Verify This Payment</h2>
      <p className="text-gray-500 text-sm max-w-sm">
        {orderNumber
          ? <>We couldn&apos;t find payment details for order <strong>{orderNumber}</strong>.</>
          : "This payment link is missing the information we need to look it up."}{" "}
        If you completed a payment, please contact support with your order number.
      </p>
      <div className="flex gap-3 mt-2">
        <Link href="/" className="border border-gray-200 px-6 py-2.5 text-sm font-bold rounded hover:border-black transition">Home</Link>
        <Link href="/contact" className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:bg-gray-800 transition">Contact Support</Link>
      </div>
    </Shell>
  );
}

export default PaymentResult;
