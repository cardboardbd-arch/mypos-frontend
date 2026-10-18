"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ChevronRight, ShieldCheck, Truck, RotateCcw, Tag, ShoppingCart, CheckCircle2, MapPin, AlertCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { getAddresses, type CustomerAddress } from "@/lib/auth";
import { formatItemAttributes } from "@/lib/attributes";
import { resolveMediaUrl } from "@/lib/media";
import { trackMetaEvent, getMetaCookie } from "@/lib/meta-pixel";

export default function CheckoutPage() {
  const { items, cartTotal, loading: cartLoading, error: cartError, refreshCart, removeFromCart } = useCart();
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    address: "", area: "", city: "Dhaka", notes: "",
  });

  // Authenticated-customer saved-address selection — purely additive.
  // Guests, and authenticated customers with no saved addresses, never see
  // this and keep using the manual fields below exactly as before.
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "manual" | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;
    getAddresses(token)
      .then((res) => {
        const list = res.data ?? [];
        setSavedAddresses(list);
        const preferred = list.find((a) => a.is_default) ?? list[0];
        if (preferred) selectSavedAddress(preferred);
      })
      .catch(() => {/* checkout must work even if the address book fails to load */});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectSavedAddress(addr: CustomerAddress) {
    setSelectedAddressId(addr.id);
    setForm((prev) => ({
      ...prev,
      name: addr.recipient_name,
      phone: addr.phone,
      address: addr.address,
      area: addr.area ?? "",
      city: addr.city ?? prev.city,
    }));
  }

  function selectManualEntry() {
    setSelectedAddressId("manual");
  }
  const [deliveryType, setDeliveryType] = useState<"inside" | "outside">("inside");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad" | "card">("cod");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  // Set only if the order was created but starting the gateway payment
  // failed — the order already exists, so this offers a retry rather than
  // a dead end.
  const [paymentRetry, setPaymentRetry] = useState<{ orderId: number; orderNumber: string; gateway: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const deliveryCharge = deliveryType === "inside" ? 60 : 120;
  const discount = couponApplied ? couponDiscount : 0;
  const displayTotal = Math.max(0, cartTotal - discount) + deliveryCharge;

  // A coupon's discount can depend on the shipping charge (free_shipping
  // type), so switching inside/outside Dhaka after applying invalidates the
  // number shown — force a re-check rather than silently keep a stale one.
  useEffect(() => {
    if (couponApplied) {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponError("Delivery area changed — please re-apply your coupon.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryType]);

  const initiatedCheckoutRef = useRef(false);
  useEffect(() => {
    if (!initiatedCheckoutRef.current && items.length > 0) {
      initiatedCheckoutRef.current = true;
      try {
        trackMetaEvent("InitiateCheckout", {
          num_items: items.length,
          value: displayTotal,
          currency: "BDT",
          content_type: "product",
          contents: items.map((item) => ({
            id: String(item.variantId || item.productId),
            quantity: item.quantity,
            item_price: item.price,
          })),
        });
      } catch {
        // Non-fatal if pixel tracking fails
      }
    }
  }, [items, displayTotal]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) {
      errors.name = "Full name is required";
    }

    const cleanPhone = form.phone.trim().replace(/[\s-]/g, "");
    if (!cleanPhone) {
      errors.phone = "Phone number is required";
    } else if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      errors.phone = "Please enter a valid 11-digit phone number (e.g. 017XXXXXXXX)";
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    const needsAddress = savedAddresses.length === 0 || selectedAddressId === "manual";
    if (needsAddress) {
      if (!form.address.trim()) {
        errors.address = "Full address is required";
      }
      if (!form.city.trim()) {
        errors.city = "City / District is required";
      }
    } else if (typeof selectedAddressId !== "number") {
      errors.address = "Please select a delivery address";
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted errors below before placing your order.");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return false;
    }
    return true;
  }

  async function handleApplyCoupon() {
    const code = coupon.trim();
    if (!code) return;

    setCouponValidating(true);
    setCouponError("");

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const params = new URLSearchParams({
        code,
        total: String(cartTotal),
        shipping: String(deliveryCharge),
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/coupons/validate?${params}`, { headers });
      const data = await res.json();

      if (data.valid) {
        setCouponApplied(true);
        setCouponDiscount(Number(data.discount_amount) || 0);
        setCouponError("");
      } else {
        setCouponApplied(false);
        setCouponDiscount(0);
        setCouponError(data.message ?? "Invalid coupon code.");
      }
    } catch {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponError("Network error while checking that code. Please try again.");
    } finally {
      setCouponValidating(false);
    }
  }

  function handleRemoveCoupon() {
    setCoupon("");
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponError("");
  }

  // bKash/Nagad are their own gateway slugs; the storefront's "Debit /
  // Credit Card" option is processed through SSLCommerz.
  function gatewaySlug(): string {
    return paymentMethod === "card" ? "sslcommerz" : paymentMethod;
  }

  async function startGatewayPayment(orderId: number, orderNo: string) {
    setRedirecting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ order_id: orderId, gateway: gatewaySlug() }),
      });
      const data = await res.json();

      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
        return; // page is navigating away
      }

      setRedirecting(false);
      setPaymentRetry({ orderId, orderNumber: orderNo, gateway: gatewaySlug() });
      setError(data.message ?? "Could not start payment. You can try again below.");
    } catch {
      setRedirecting(false);
      setPaymentRetry({ orderId, orderNumber: orderNo, gateway: gatewaySlug() });
      setError("Network error while starting payment. You can try again below.");
    }
  }

  async function handleSubmit() {
    setError("");
    setValidationErrors({});
    setPaymentRetry(null);
    if (!validateForm()) return;
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    const invalidItem = items.find(item => !item.productId || !item.variantId);
    if (invalidItem) {
      setError("Some items in your cart have incomplete product or variant details. Please remove them and re-add them.");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    setLoading(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const fbp = getMetaCookie("_fbp");
    const fbc = getMetaCookie("_fbc");

    const orderData = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      area: form.area.trim(),
      city: form.city.trim(),
      // Server is authoritative: it re-verifies address_id belongs to the
      // authenticated customer and builds the shipping_address snapshot
      // from the saved record itself, not from the fields above — those
      // are still sent for display consistency but ignored server-side
      // whenever address_id is present. See OrderController::store().
      address_id: typeof selectedAddressId === "number" ? selectedAddressId : undefined,
      notes: form.notes.trim() || undefined,
      payment_method: paymentMethod,
      delivery_charge: deliveryCharge,
      coupon_code: couponApplied ? coupon : undefined,
      fbp,
      fbc,
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
    if (fbp) headers["X-FBP"] = fbp;
    if (fbc) headers["X-FBC"] = fbc;

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
          const unmappedErrors: string[] = [];

          for (const [field, messages] of Object.entries(data.errors)) {
            const msg = Array.isArray(messages) ? messages[0] : String(messages);
            fieldErrors[field] = msg;

            if (["name", "phone", "email", "address", "area", "city"].includes(field)) {
              // Direct form fields
            } else if (field.startsWith("items")) {
              const match = field.match(/items\.(\d+)/);
              if (match) {
                const itemIdx = parseInt(match[1], 10);
                const itemName = items[itemIdx]?.name ? `"${items[itemIdx].name}"` : `Item #${itemIdx + 1}`;
                unmappedErrors.push(`${itemName}: ${msg}`);
              } else {
                unmappedErrors.push(`Cart: ${msg}`);
              }
            } else if (field !== "coupon_code") {
              unmappedErrors.push(`${field.replace(/_/g, " ")}: ${msg}`);
            }
          }
          setValidationErrors(fieldErrors);

          if (unmappedErrors.length > 0) {
            setError(unmappedErrors.join(" • "));
          } else {
            setError("Please fix the highlighted errors below.");
          }

          // The coupon passed a pre-check but was rejected at order-creation
          // time (e.g. someone else used its last redemption in between) —
          // drop it so the displayed total stops claiming a discount that
          // was never applied.
          if (fieldErrors.coupon_code) {
            setCouponApplied(false);
            setCouponDiscount(0);
            setCouponError(fieldErrors.coupon_code);
          }
        } else {
          setError(data.message ?? `Order failed (HTTP ${res.status})`);
        }
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setLoading(false);
        return;
      }

      if (!data.order_number) {
        setError(data.message ?? "Order failed. Please try again.");
        setLoading(false);
        return;
      }

      try {
        trackMetaEvent(
          "Purchase",
          {
            currency: "BDT",
            value: displayTotal,
            content_type: "product",
            content_ids: items.map((item) => String(item.variantId || item.productId)),
            contents: items.map((item) => ({
              id: String(item.variantId || item.productId),
              quantity: item.quantity,
              item_price: item.price,
            })),
            num_items: items.length,
            order_id: data.order_number,
          },
          data.event_id
        );
      } catch {
        // Non-fatal if pixel tracking fails
      }

      await refreshCart();

      if (paymentMethod === "cod") {
        setPlaced(true);
        setOrderNumber(data.order_number);
        setLoading(false);
        return;
      }

      // Order exists now (payment_status: pending) — send the shopper to
      // the real gateway. Success/failure lands back on /payment/success
      // or /payment/failed, which independently verify status server-side.
      await startGatewayPayment(data.id, data.order_number);
      setLoading(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
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
          <Link href="/track-order" className="border border-gray-200 px-6 py-2.5 text-sm font-bold rounded hover:border-black transition">Track Order</Link>
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
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-bold text-red-800">{error}</p>
                  {Object.entries(validationErrors).filter(([k]) => !k.startsWith("items") && k !== "coupon_code").length > 0 && (
                    <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5 pt-1">
                      {Object.entries(validationErrors)
                        .filter(([k]) => !k.startsWith("items") && k !== "coupon_code")
                        .map(([k, v]) => (
                          <li key={k}>
                            <span className="font-semibold capitalize">{k.replace(/_/g, " ")}:</span> {v}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
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
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white ${validationErrors.email ? "border-red-300" : "border-gray-200"}`} />
                    {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
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

                  {/* Saved-address selection (authenticated customers only) */}
                  {savedAddresses.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Delivery Address</label>
                      <div className="space-y-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => selectSavedAddress(addr)}
                            className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition ${
                              selectedAddressId === addr.id ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <span className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedAddressId === addr.id ? "border-black" : "border-gray-300"}`}>
                              {selectedAddressId === addr.id && <span className="h-2 w-2 rounded-full bg-black" />}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-black uppercase flex items-center gap-2">
                                {addr.label}
                                {addr.is_default && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black text-white">DEFAULT</span>}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{addr.recipient_name} · {addr.phone}</p>
                              <p className="text-xs text-gray-400 truncate">{[addr.address, addr.area, addr.city].filter(Boolean).join(", ")}</p>
                            </div>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={selectManualEntry}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition ${
                            selectedAddressId === "manual" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <span className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedAddressId === "manual" ? "border-black" : "border-gray-300"}`}>
                            {selectedAddressId === "manual" && <span className="h-2 w-2 rounded-full bg-black" />}
                          </span>
                          <span className="text-xs font-black uppercase flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> Enter a different address
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual address fields — shown for guests, customers with
                      no saved addresses, or when "Enter a different address"
                      is chosen. */}
                  {(savedAddresses.length === 0 || selectedAddressId === "manual") && (
                    <>
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
                            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white ${validationErrors.area ? "border-red-300" : "border-gray-200"}`} />
                          {validationErrors.area && <p className="text-red-500 text-xs mt-1">{validationErrors.area}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">City / District <span className="text-red-500">*</span></label>
                          <select name="city" value={form.city} onChange={handleChange}
                            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white ${validationErrors.city ? "border-red-300" : "border-gray-200"}`}>
                            {["Dhaka","Chattogram","Sylhet","Rajshahi","Khulna","Barishal","Rangpur","Mymensingh","Comilla","Narayanganj","Gazipur"].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          {validationErrors.city && <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>}
                        </div>
                      </div>
                    </>
                  )}

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

                  {(paymentMethod === "bkash" || paymentMethod === "nagad" || paymentMethod === "card") && (
                    <div className={`rounded-xl p-4 border text-sm ${paymentMethod === "bkash" ? "bg-red-50 border-red-100 text-red-800" : paymentMethod === "nagad" ? "bg-orange-50 border-orange-100 text-orange-800" : "bg-blue-50 border-blue-100 text-blue-800"}`}>
                      <p className="font-bold">
                        You&apos;ll be redirected to {paymentMethod === "bkash" ? "bKash" : paymentMethod === "nagad" ? "Nagad" : "the card payment gateway"} to pay <strong>Tk {displayTotal.toLocaleString()}</strong> after placing this order.
                      </p>
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
                  {items.map((item, index) => {
                    const itemError =
                      validationErrors[`items.${index}.variant_id`] ||
                      validationErrors[`items.${index}.product_id`] ||
                      validationErrors[`items.${index}.quantity`];
                    return (
                      <div
                        key={item.variantId || index}
                        className={`flex gap-3 p-2 rounded-xl transition ${
                          itemError ? "bg-red-50 border border-red-200" : ""
                        }`}
                      >
                        <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                          {(() => {
                            const thumb = resolveMediaUrl(item.thumbnail) || item.thumbnail;
                            return thumb ? (
                              <img
                                src={thumb}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                  const parent = (e.currentTarget as HTMLElement).parentElement;
                                  if (parent && !parent.querySelector(".fallback-box")) {
                                    const span = document.createElement("span");
                                    span.className = "text-xl fallback-box";
                                    span.innerText = "📦";
                                    parent.appendChild(span);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-xl">📦</span>
                            );
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                          {formatItemAttributes(item.attributes) && (
                            <p className="text-[10px] text-gray-500 font-medium">
                              {formatItemAttributes(item.attributes)}
                            </p>
                          )}
                          {itemError && (
                            <div className="flex items-center justify-between gap-2 mt-1 bg-white/70 p-1 rounded border border-red-200">
                              <p className="text-[10px] font-bold text-red-600 leading-tight">
                                ⚠️ {itemError}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.variantId)}
                                className="text-[10px] font-bold text-red-600 hover:text-red-800 underline shrink-0 px-1"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                            <span className="text-xs font-black text-gray-900">Tk {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon */}
                <div className="px-5 pb-4 border-t border-gray-50 pt-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        value={coupon}
                        onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponError(""); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                        placeholder="Coupon code"
                        disabled={couponApplied || couponValidating}
                        className={`w-full pl-8 pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:border-black transition bg-gray-50 focus:bg-white disabled:opacity-50 ${couponError ? "border-red-300" : "border-gray-200"}`} />
                    </div>
                    {couponApplied ? (
                      <button onClick={handleRemoveCoupon}
                        className="px-4 py-2.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition shrink-0">
                        Remove
                      </button>
                    ) : (
                      <button onClick={handleApplyCoupon} disabled={couponValidating || !coupon.trim()}
                        className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-40 shrink-0">
                        {couponValidating ? "Checking…" : "Apply"}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
                  {validationErrors.coupon_code && !couponError && (
                    <p className="text-red-500 text-xs mt-1.5">{validationErrors.coupon_code}</p>
                  )}
                  {couponApplied && (
                    <p className="text-[11px] text-green-600 font-bold mt-1.5">🎉 Coupon applied — you saved Tk {couponDiscount.toLocaleString()}!</p>
                  )}
                </div>

                {/* Pricing */}
                <div className="px-5 pb-5 space-y-2.5 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-800">Tk {cartTotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Coupon Discount</span>
                      <span className="font-bold">− Tk {discount.toLocaleString()}</span>
                    </div>
                  )}
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
                  {paymentRetry ? (
                    <button
                      onClick={() => startGatewayPayment(paymentRetry.orderId, paymentRetry.orderNumber)}
                      disabled={redirecting}
                      className="w-full bg-black hover:bg-gray-900 text-white py-4 text-sm font-black uppercase tracking-widest rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {redirecting ? "Redirecting…" : `Retry Payment for #${paymentRetry.orderNumber} →`}
                    </button>
                  ) : (
                    <button onClick={handleSubmit} disabled={loading || redirecting}
                      className="w-full bg-black hover:bg-gray-900 text-white py-4 text-sm font-black uppercase tracking-widest rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading || redirecting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          {redirecting ? "Redirecting to payment gateway…" : "Placing Order..."}
                        </>
                      ) : "Place Order →"}
                    </button>
                  )}

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
