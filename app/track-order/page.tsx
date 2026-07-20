"use client";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Search, Package, Truck, CheckCircle, Clock } from "lucide-react";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [tracked, setTracked] = useState(false);

  const handleTrack = () => { if (orderId && phone) setTracked(true); };

  const STEPS = [
    { icon: Package, label: "Order Placed", time: "Jun 25, 2026 10:00 AM", done: true },
    { icon: CheckCircle, label: "Confirmed", time: "Jun 25, 2026 11:30 AM", done: true },
    { icon: Clock, label: "Processing", time: "Jun 25, 2026 2:00 PM", done: true },
    { icon: Truck, label: "Shipped", time: "Jun 26, 2026 9:00 AM", done: false },
    { icon: CheckCircle, label: "Delivered", time: "Expected Jun 27, 2026", done: false },
  ];

  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[700px] mx-auto px-6 py-10">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-6 text-center">Track Your Order</h1>
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</label>
                <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. ORD-2026-001"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
              </div>
              <button onClick={handleTrack}
                className="w-full bg-black hover:bg-gray-800 text-white py-3.5 text-sm font-black uppercase tracking-widest rounded-sm transition flex items-center justify-center gap-2">
                <Search className="h-4 w-4" /> Track Order
              </button>
            </div>
          </div>
          {tracked && (
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-sm font-black uppercase tracking-wider mb-6">Order #{orderId} — Status</h2>
              <div className="space-y-4">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-black' : 'bg-gray-100'}`}>
                      <step.icon className={`h-5 w-5 ${step.done ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 pt-1.5">
                      <p className={`text-sm font-black ${step.done ? 'text-black' : 'text-gray-400'}`}>{step.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
