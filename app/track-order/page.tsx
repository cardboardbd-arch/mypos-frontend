"use client";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Search, Package, CheckCircle, Clock, Truck, XCircle, RotateCcw } from "lucide-react";

interface TimelineStep {
  status: string;
  label: string;
  completed: boolean;
  timestamp: string | null;
}

interface TrackedOrderItem {
  title: string;
  quantity: number;
  thumbnail: string | null;
}

interface TrackedOrder {
  order_number: string;
  status: string;
  status_label: string;
  created_at: string;
  items: TrackedOrderItem[];
  timeline: TimelineStep[];
}

// Off-path terminal statuses render as a distinct "stopped here" message
// instead of pretending the order is still progressing through steps it
// will never reach — the icon shown depends on which bucket the status
// falls into.
const OFF_PATH_STATUSES = new Set([
  "cancelled", "returned", "refunded", "rejected",
  "failed_delivery", "return_requested", "return_approved",
]);

const RETURN_LIKE_STATUSES = new Set(["returned", "return_requested", "return_approved"]);

const STEP_ICONS: Record<string, typeof Package> = {
  placed: Package,
  confirmed: CheckCircle,
  processing: Clock,
  packed: Clock,
  courier: Truck,
  delivered: CheckCircle,
};

function formatDate(value: string | null): string {
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
      // Phase 10.6A — order_number + phone travel in the POST body, not the
      // URL query string, so neither is exposed via browser history, server
      // access logs, or a shared/bookmarked link.
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/orders/track`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: orderNumber.trim(), phone: phone.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? "We couldn't find an order with those details. Please check your order number and phone number.");
        return;
      }

      setOrder(data.data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const isOffPath = order ? OFF_PATH_STATUSES.has(order.status) : false;
  const finalStep = order?.timeline[order.timeline.length - 1];

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
                <h2 className="text-sm font-black uppercase tracking-wider">Order #{order.order_number} — {order.status_label}</h2>
              </div>

              {isOffPath && finalStep ? (
                <div className="flex items-start gap-4 rounded-xl bg-gray-50 p-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-900">
                    {RETURN_LIKE_STATUSES.has(order.status)
                      ? <RotateCcw className="h-5 w-5 text-white" />
                      : <XCircle className="h-5 w-5 text-white" />}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className="text-sm font-black text-black">{finalStep.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(finalStep.timestamp)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.timeline.map(step => {
                    const Icon = STEP_ICONS[step.status] ?? Package;
                    return (
                      <div key={step.status} className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step.completed ? "bg-black" : "bg-gray-100"}`}>
                          <Icon className={`h-5 w-5 ${step.completed ? "text-white" : "text-gray-400"}`} />
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p className={`text-sm font-black ${step.completed ? "text-black" : "text-gray-400"}`}>{step.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{step.timestamp ? formatDate(step.timestamp) : step.completed ? "" : "Pending"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {order.items.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Items</p>
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-black">{item.title}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
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
