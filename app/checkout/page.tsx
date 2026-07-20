"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ChevronRight, ShieldCheck, Truck, RotateCcw, Tag, ShoppingCart, CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";

export default function CheckoutPage() {
  const { items, cartTotal, loading: cartLoading, error: cartError, refreshCart } = useCart();
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    address: "", area: "", city: "Dhaka", notes: "",
  });
  const [deliveryType, setDeliveryType] = useState<"inside" | "outside">("inside");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad" | "card">("cod");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const deliveryCharge = deliveryType === "inside" ? 60 : 120;
  const displayTotal = cartTotal + deliveryCharge;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.phone.trim()) errors.phone = "Phone is required";
    if (!form.address.trim()) errors.address = "Address is required";
    if ((paymentMethod === "bkash" || paymentMethod === "nagad") && !txnId.trim()) {
      errors.txnId = "Transaction ID is required for this payment method";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    setError("");
    setValidationErrors({});
    if (!validateForm()) return;
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setLoading(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const orderData = {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      address: form.address,
      area: form.area,
      city: form.city,
      notes: form.notes,
      payment_method: paymentMethod,
      delivery_charge: deliveryCharge,
      coupon_code: couponApplied ? coupon : undefined,
      items: items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sku: item.sku,
      })),
    };

    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(data.errors)) {
            fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
          }
          setValidationErrors(fieldErrors);
          setError("Please fix the errors below.");
        } else {
          setError(data.message ?? `Order failed (HTTP ${res.status})`);
        }
        setLoading(false);
        return;
      }

      if (data.order_number) {
        setPlaced(true);
        setOrderNumber(data.order_number);
        await refreshCart();
      } else {
        setError(data.message ?? "Order failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (cartLoading) {
    return (
      <>
        <Nav />
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">Loading cart...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (cartError) {
    return (
      <>
        <Nav />
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-sm mb-4">{cartError}</p>
            <button onClick={refreshCart} className="px-4 py-2 bg-black text-white text-sm font-bold rounded">Retry</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!placed && items.length === 0) return (
    <>
      <Nav />
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 py-20 px-4 text-center">
        <ShoppingCart className="h-14 w-14 text-gray-200" />
        <p className="text-gray-400 text-sm">Your cart is empty.</p>
        <Link href="/shop" className="bg-black text-white px-8 py-3 text-sm font-bold uppercase tracking-wider rounded hover:bg-gray-800 transition">
          Go to Shop
        </Link>
      </div>
      <Footer />
    </>
  );

  if (placed) return (
    <>
      <Nav />
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-black">Order Placed Successfully!</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Thank you, <strong>{form.name}</strong>! Your order has been received. We will call you at <strong>{form.phone}</strong> to confirm.
        </p>
        <p className="text-gray-500 text-sm mb-2">Order ID: <strong>{orderNumber}</strong></p>
        <p className="text-gray-400 text-xs mb-6">Save this ID to track your order.</p>
        <div className="flex gap-3 mt-2">
          <Link href="/" className="border border-gray-200 px-6 py-2.5 text-sm font-bold rounded hover:border-black transition">Home</Link>
          <Link href="/shop" className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:bg-gray-800 transition">Continue Shopping</Link>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Nav />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100 py-3.5">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-black transition">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/cart" className="hover:text-black transition">Cart</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-700 font-semibold">Checkout</span>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* LEFT COLUMN */}
            <div className="space-y-4">

              {/* STEP 1 — Contact Info */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">1</span>
                  <h2 className="text-sm font-black uppercase tracking-wider">Contact Information</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
                    <input name="name" value={form.name} onChange={handleChange}
                      placeholder="Enter your full name"
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white ${validationErrors.name ? "border-red-300" : "border-gray-200"}`} />
                    {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Phone Number <span className="text-red-500">*</span></label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white ${validationErrors.phone ? "border-red-300" : "border-gray-200"}`} />
                    {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Email Address <span className="text-gray-300">(Optional)</span></label>
                    <input name="email" value={form.email} onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white" />
                  </div>
                </div>
              </div>

              {/* STEP 2 — Delivery */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">2</span>
                  <h2 className="text-sm font-black uppercase tracking-wider">Delivery Information</h2>
                </div>
                <div className="p-6 space-y-5">

                  {/* Delivery zone toggle */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Delivery Area</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "inside", title: "Inside Dhaka", sub: "Tk 60  •  1-2 days" },
                        { key: "outside", title: "Outside Dhaka", sub: "Tk 120  •  3-5 days" },
                      ].map(opt => (
                        <button key={opt.key} type="button"
                          onClick={() => setDeliveryType(opt.key as "inside" | "outside")}
                          className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition
                            ${deliveryType === opt.key ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400 bg-white"}`}>
                          <Truck className="h-5 w-5 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-black uppercase">{opt.title}</p>
                            <p className={`text-[11px] mt-0.5 ${deliveryType === opt.key ? "text-gray-300" : "text-gray-400"}`}>{opt.sub}</p>
                          </div>
                          {deliveryType === opt.key && (
                            <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address fields */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Full Address <span className="text-red-500">*</span></label>
                    <textarea name="address" value={form.address} onChange={handleChange}
                      placeholder="House no., Road, Block, Area..."
                      rows={3}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white resize-none ${validationErrors.address ? "border-red-300" : "border-gray-200"}`} />
                    {validationErrors.address && <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Thana / Area</label>
                      <input name="area" value={form.area} onChange={handleChange}
                        placeholder="Mirpur, Dhanmondi..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">City / District</label>
                      <select name="city" value={form.city} onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white">
                        {["Dhaka","Chattogram","Sylhet","Rajshahi","Khulna","Barishal","Rangpur","Mymensingh","Comilla","Narayanganj","Gazipur"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Order Notes <span className="text-gray-300">(Optional)</span></label>
                    <textarea name="notes" value={form.notes} onChange={handleChange}
                      placeholder="Any special instructions for your order..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white resize-none" />
                  </div>
                </div>
              </div>

              {/* STEP 3 — Payment */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">3</span>
                  <h2 className="text-sm font-black uppercase tracking-wider">Payment Method</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: "cod",   label: "Cash on\nDelivery", emoji: "💵", bg: "bg-green-50" },
                      { id: "bkash", label: "bKash",             emoji: "🔴", bg: "bg-red-50" },
                      { id: "nagad", label: "Nagad",             emoji: "🟠", bg: "bg-orange-50" },
                      { id: "card",  label: "Debit /\nCredit Card", emoji: "💳", bg: "bg-blue-50" },
                    ].map(pm => (
                      <button key={pm.id} type="button"
                        onClick={() => setPaymentMethod(pm.id as "cod" | "bkash" | "nagad" | "card")}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition
                          ${paymentMethod === pm.id ? "border-black bg-black text-white" : `border-gray-200 hover:border-gray-300 ${pm.bg}`}`}>
                        <span className="text-2xl leading-none">{pm.emoji}</span>
                        <p className="text-[10px] font-black uppercase tracking-wide leading-tight text-center whitespace-pre-line">{pm.label}</p>
                        {paymentMethod === pm.id && (
                          <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* MFS transaction ID */}
                  {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                    <div className={`rounded-xl p-4 border text-sm ${paymentMethod === "bkash" ? "bg-red-50 border-red-100 text-red-800" : "bg-orange-50 border-orange-100 text-orange-800"}`}>
                      <p className="font-bold mb-1">
                        Send <strong>Tk {displayTotal.toLocaleString()}</strong> to{" "}
                        <span className="font-black">01XXXXXXXXX</span>{" "}
                        ({paymentMethod === "bkash" ? "bKash Merchant" : "Nagad"})
                      </p>
                      <p className="text-xs opacity-75 mb-3">Use &quot;Send Money&quot; and enter the Transaction ID below.</p>
                      <input
                        value={txnId} onChange={e => setTxnId(e.target.value)}
                        placeholder={`Enter ${paymentMethod === "bkash" ? "bKash" : "Nagad"} Transaction ID`}
                        className={`w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none border bg-white ${validationErrors.txnId ? "border-red-400" : paymentMethod === "bkash" ? "border-red-200 focus:border-red-400" : "border-orange-200 focus:border-orange-400"}`} />
                      {validationErrors.txnId && <p className="text-red-500 text-xs mt-1">{validationErrors.txnId}</p>}
                    </div>
                  )}

                  {paymentMethod === "cod" && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      💵 Pay in cash when your order is delivered. No advance payment required.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN — Order Summary */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-black uppercase tracking-wider">Order Summary</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{items.length} {items.length === 1 ? "item" : "items"}</p>
                </div>

                {/* Items */}
                <div className="p-5 space-y-4 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                        {item.thumbnail
                          ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                          : <span className="text-xl">📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                        {item.attributes && Object.entries(item.attributes).length > 0 && (
                          <p className="text-[10px] text-gray-400">
                            {Object.entries(item.attributes).filter(([, v]) => v !== "Default").map(([k, v]) => `${k}: ${v}`).join(" • ")}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                          <span className="text-xs font-black text-gray-900">Tk {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="px-5 pb-4 border-t border-gray-50 pt-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        disabled={couponApplied}
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white disabled:opacity-50" />
                    </div>
                    <button onClick={() => setCouponApplied(true)} disabled={couponApplied || !coupon.trim()}
                      className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-40 shrink-0">
                      {couponApplied ? "Applied ✓" : "Apply"}
                    </button>
                  </div>
                  {couponApplied && (
                    <p className="text-[11px] text-green-600 font-bold mt-1.5">🎉 Coupon applied! Discount will be calculated at checkout.</p>
                  )}
                </div>

                {/* Pricing */}
                <div className="px-5 pb-5 space-y-2.5 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-800">Tk {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Delivery Charge</span>
                    <span className="font-bold text-gray-800">Tk {deliveryCharge}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center">
                    <span className="text-sm font-black uppercase text-gray-900">Total</span>
                    <span className="text-xl font-black text-gray-900">Tk {displayTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <button onClick={handleSubmit} disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 text-white py-4 text-sm font-black uppercase tracking-widest rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Placing Order...
                      </>
                    ) : "Place Order →"}
                  </button>

                  {/* Trust badges */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { icon: <ShieldCheck className="h-4 w-4 text-green-500 mx-auto mb-1" />, label: "Secure\nPayment" },
                      { icon: <RotateCcw className="h-4 w-4 text-blue-500 mx-auto mb-1" />, label: "7-Day\nReturn" },
                      { icon: <Truck className="h-4 w-4 text-orange-500 mx-auto mb-1" />, label: "Fast\nDelivery" },
                    ].map((b, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl py-2.5 px-1">
                        {b.icon}
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide leading-tight whitespace-pre-line">{b.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
