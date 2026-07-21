"use client";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Search, Package, CheckCircle, Clock, Truck, XCircle, RotateCcw } from "lucide-react";

interface OrderTimeline {
  placed_at: string | null;
  confirmed_at: string | null;
  processing_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
}

interface OrderCourier {
  name: string | null;
  tracking_number: string | null;
  status: string | null;
}

interface TrackedOrder {
  order_number: string;
  status: string;
  stage: string;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  timeline?: OrderTimeline;
  courier?: OrderCourier | null;
  estimated_delivery?: string | null;
}

const PIPELINE_STEPS = [
  { stage: "placed", label: "Order Placed", icon: Package, timeKey: "placed_at" as const },
  { stage: "confirmed", label: "Confirmed", icon: CheckCircle, timeKey: "confirmed_at" as const },
  { stage: "processing", label: "Processing", icon: Clock, timeKey: "processing_at" as const },
  { stage: "packed", label: "Packed", icon: Clock, timeKey: "packed_at" as const },
  { stage: "courier", label: "With Courier", icon: Truck, timeKey: "shipped_at" as const },
  { stage: "delivered", label: "Delivered", icon: CheckCircle, timeKey: "delivered_at" as const },
];

// Stage order used to decide which steps are "done" — everything up to and
// including the order's current stage.
const STAGE_ORDER = ["placed", "confirmed", "processing", "packed", "courier", "delivered"];

const OFF_PATH_LABELS: Record<string, string> = {
  cancelled: "This order was cancelled.",
  returned: "This order was returned.",
  refunded: "This order was refunded.",
  rejected: "This order was rejected.",
  failed_delivery: "The last delivery attempt failed. Our courier will retry, or contact support.",
  return_requested: "A return has been requested for this order.",
  return_approved: "The return for this order has been approved.",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function handleTrack() {
    if (!orderNumber.trim() || !phone.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const params = new URLSearchParams({ phone: phone.trim() });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/orders/${encodeURIComponent(orderNumber.trim())}?${params}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Order not found. Check your order number and phone number.");
        return;
      }

      setOrder(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const offPathMessage = order && OFF_PATH_LABELS[order.stage];
  const currentStageIndex = order ? STAGE_ORDER.indexOf(order.stage) : -1;

  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[700px] mx-auto px-6 py-10">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-6 text-center">Track Your Order</h1>
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Number</label>
                <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="e.g. ECO-20260721-0001"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleTrack(); } }}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
              </div>
              <button onClick={handleTrack} disabled={loading || !orderNumber.trim() || !phone.trim()}
                className="w-full bg-black hover:bg-gray-800 text-white py-3.5 text-sm font-black uppercase tracking-widest rounded-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                <Search className="h-4 w-4" /> {loading ? "Searching…" : "Track Order"}
              </button>
              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            </div>
          </div>

          {order && (
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black uppercase tracking-wider">Order #{order.order_number} — Status</h2>
                <span className="text-xs font-bold text-gray-500">Tk {Number(order.total).toLocaleString()}</span>
              </div>

              {offPathMessage ? (
                <div className="flex items-start gap-4 rounded-xl bg-gray-50 p-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-900">
                    {order.stage === "returned" || order.stage === "return_requested" || order.stage === "return_approved"
                      ? <RotateCcw className="h-5 w-5 text-white" />
                      : <XCircle className="h-5 w-5 text-white" />}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className="text-sm font-black text-black">{offPathMessage}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Current status: {order.status.replace(/_/g, " ")}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {PIPELINE_STEPS.map((step, i) => {
                    const done = currentStageIndex >= i;
                    const time = order.timeline?.[step.timeKey];
                    return (
                      <div key={step.stage} className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-black" : "bg-gray-100"}`}>
                          <step.icon className={`h-5 w-5 ${done ? "text-white" : "text-gray-400"}`} />
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p className={`text-sm font-black ${done ? "text-black" : "text-gray-400"}`}>{step.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{time ? formatDate(time) : done ? "" : "Pending"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {order.courier?.tracking_number && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-4">
                  <Truck className="h-8 w-8 text-gray-300 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Courier</p>
                    <p className="text-sm font-black text-black">{order.courier.name ?? "Courier"} — {order.courier.tracking_number}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
