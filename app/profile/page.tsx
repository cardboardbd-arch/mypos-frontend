"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import {
  getProfile,
  logoutCustomer,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getToken,
  removeToken,
  type CustomerAddress,
} from "@/lib/auth";
import { User, Package, MapPin, LogOut, ChevronRight, X, LayoutGrid, Clock, CheckCircle2, Plus, Pencil, Trash2 } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items?: unknown[];
}

interface OrderDetail {
  order_number: string;
  status: string;
  status_label: string;
  created_at: string;
  total: number;
  payment_status: string;
  can_cancel: boolean;
  items: { title: string; quantity: number; thumbnail: string | null; price: number; subtotal: number }[];
  timeline: { status: string; label: string; completed: boolean; timestamp: string | null }[];
}

type Tab = "overview" | "profile" | "orders" | "addresses";

// Orders in these statuses count as "completed" / "in progress" for the
// overview stats. Mirrors the pipeline stages the backend already collapses
// order_status into (see OrderController::pipelineStage()) — no new status
// vocabulary invented here.
const COMPLETED_STATUSES = new Set(["delivered"]);
const CANCELLED_STATUSES = new Set(["cancelled", "returned", "refunded", "rejected", "failed_delivery"]);

const ORDER_FILTERS: { key: string; label: string; statuses?: string[] }[] = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing", statuses: ["pending", "confirmed", "processing", "picking", "packing", "packed"] },
  { key: "shipped", label: "Shipped", statuses: ["ready_for_dispatch", "courier_assigned", "shipped", "out_for_delivery"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled", "returned", "refunded", "rejected", "failed_delivery"] },
];

function statusBadgeClasses(status: string): string {
  if (COMPLETED_STATUSES.has(status)) return "bg-green-50 text-green-600";
  if (CANCELLED_STATUSES.has(status)) return "bg-red-50 text-red-600";
  return "bg-yellow-50 text-yellow-700";
}

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Lazy initializer (not an effect) reads ?tab= without useSearchParams,
  // which would force this otherwise-static page into a Suspense boundary —
  // the header's "Orders" link uses this.
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "overview";
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab === "orders" || tab === "profile" || tab === "addresses" ? tab : "overview";
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");

  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState("");
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: "", email: "", address: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState("");
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [addressModal, setAddressModal] = useState<"new" | CustomerAddress | null>(null);
  const [addressForm, setAddressForm] = useState({ label: "Home", recipient_name: "", phone: "", address: "", area: "", city: "", postal_code: "" });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressSaveError, setAddressSaveError] = useState("");
  const [addressActionId, setAddressActionId] = useState<number | null>(null);

  const token = getToken();

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    getProfile(token).then(data => {
      if (data.id) {
        setCustomer(data as Customer);
        setProfileForm({ name: data.name ?? "", email: data.email ?? "", address: data.address ?? "" });
      } else {
        removeToken();
        router.push("/login");
      }
      setLoading(false);
    }).catch((err) => {
      setError(err.message || "Failed to load profile");
      setLoading(false);
      if (err.message === "UNAUTHORIZED") {
        removeToken();
        router.push("/login");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    // Overview needs order data too, so load once on entry rather than
    // lazily per-tab.
    if (!token || !customer) return;
    setOrdersLoading(true);
    setOrdersError("");
    getMyOrders(token)
      .then((data) => setOrders((data.data as Order[]) ?? []))
      .catch((err: any) => {
        setOrdersError(err.message || "Failed to load orders");
        if (err.message === "UNAUTHORIZED") {
          removeToken();
          router.push("/login");
        }
      })
      .finally(() => setOrdersLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  useEffect(() => {
    if (!token || activeTab !== "addresses" || addressesLoaded) return;
    setAddressesLoading(true);
    setAddressesError("");
    getAddresses(token)
      .then((res) => setAddresses(res.data ?? []))
      .catch((err: any) => {
        setAddressesError(err.message || "Failed to load addresses");
        if (err.message === "UNAUTHORIZED") {
          removeToken();
          router.push("/login");
        }
      })
      .finally(() => {
        setAddressesLoading(false);
        setAddressesLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token, addressesLoaded]);

  const openAddressModal = (address: "new" | CustomerAddress) => {
    setAddressSaveError("");
    setAddressModal(address);
    setAddressForm(
      address === "new"
        ? { label: "Home", recipient_name: customer?.name ?? "", phone: customer?.phone ?? "", address: "", area: "", city: "", postal_code: "" }
        : {
            label: address.label,
            recipient_name: address.recipient_name,
            phone: address.phone,
            address: address.address,
            area: address.area ?? "",
            city: address.city ?? "",
            postal_code: address.postal_code ?? "",
          }
    );
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || addressSaving) return;
    setAddressSaving(true);
    setAddressSaveError("");
    try {
      const isNew = addressModal === "new";
      const res = isNew
        ? await createAddress(token, addressForm)
        : await updateAddress(token, (addressModal as CustomerAddress).id, addressForm);
      const saved = res.data as CustomerAddress;

      setAddresses((prev) => {
        const withoutDefaultClash = saved.is_default ? prev.map((a) => ({ ...a, is_default: false })) : prev;
        return isNew ? [...withoutDefaultClash, saved] : withoutDefaultClash.map((a) => (a.id === saved.id ? saved : a));
      });
      setAddressModal(null);
    } catch (err: any) {
      setAddressSaveError(err.message || "Failed to save address");
      if (err.message === "UNAUTHORIZED") {
        removeToken();
        router.push("/login");
      }
    } finally {
      setAddressSaving(false);
    }
  };

  const handleAddressDelete = async (address: CustomerAddress) => {
    if (!token || addressActionId) return;
    setAddressActionId(address.id);
    try {
      await deleteAddress(token, address.id);
      setAddresses((prev) => {
        const remaining = prev.filter((a) => a.id !== address.id);
        if (address.is_default && remaining.length > 0) {
          // Server promotes the oldest remaining address — mirror that
          // here so the UI doesn't show zero defaults until next reload.
          const oldest = [...remaining].sort((a, b) => a.id - b.id)[0];
          return remaining.map((a) => (a.id === oldest.id ? { ...a, is_default: true } : a));
        }
        return remaining;
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        removeToken();
        router.push("/login");
      }
    } finally {
      setAddressActionId(null);
    }
  };

  const handleSetDefault = async (address: CustomerAddress) => {
    if (!token || addressActionId) return;
    setAddressActionId(address.id);
    try {
      await setDefaultAddress(token, address.id);
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === address.id })));
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        removeToken();
        router.push("/login");
      }
    } finally {
      setAddressActionId(null);
    }
  };

  const openOrderDetail = async (orderNumber: string) => {
    if (!token) return;
    setSelectedOrderNumber(orderNumber);
    setOrderDetail(null);
    setOrderDetailError("");
    setOrderDetailLoading(true);
    setCancelConfirming(false);
    setCancelError("");
    setCancelSuccess(false);
    try {
      const res = await getOrderDetail(token, orderNumber);
      setOrderDetail(res.data as OrderDetail);
    } catch (err: any) {
      setOrderDetailError(err.message || "Failed to load order details");
      if (err.message === "UNAUTHORIZED") {
        removeToken();
        router.push("/login");
      }
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const closeOrderDetail = () => {
    setSelectedOrderNumber(null);
    setOrderDetail(null);
    setOrderDetailError("");
    setCancelConfirming(false);
    setCancelError("");
    setCancelSuccess(false);
  };

  const handleCancelOrder = async () => {
    if (!token || !orderDetail || cancelling) return;
    setCancelling(true);
    setCancelError("");
    try {
      const res = await cancelOrder(token, orderDetail.order_number);
      // Server response is the source of truth — replace the whole
      // detail object with it rather than guessing at the new status
      // client-side.
      setOrderDetail(res.data as OrderDetail);
      setCancelConfirming(false);
      setCancelSuccess(true);
      // Keep the already-loaded orders list (Overview/My Orders) in sync
      // without a full reload or a second API call.
      setOrders((prev) => prev.map((o) => (o.order_number === orderDetail.order_number ? { ...o, status: res.data.status } : o)));
    } catch (err: any) {
      setCancelError(err.message || "Could not cancel this order.");
      if (err.message === "UNAUTHORIZED") {
        removeToken();
        router.push("/login");
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleLogout = async () => {
    if (token) await logoutCustomer(token).catch(() => {});
    removeToken();
    router.push("/");
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || profileSaving) return;
    setProfileSaving(true);
    setProfileSaveError("");
    setProfileSaved(false);
    try {
      const updated = await updateProfile(token, profileForm);
      setCustomer(updated);
      setProfileSaved(true);
    } catch (err: any) {
      setProfileSaveError(err.message || "Failed to save changes");
      if (err.message === "UNAUTHORIZED") {
        removeToken();
        router.push("/login");
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const filter = ORDER_FILTERS.find((f) => f.key === orderFilter);
    return !filter?.statuses || filter.statuses.includes(o.status);
  });

  const availableFilters = ORDER_FILTERS.filter(
    (f) => f.key === "all" || orders.some((o) => f.statuses?.includes(o.status))
  );

  const totalOrders = orders.length;
  const inProgressCount = orders.filter(
    (o) => !COMPLETED_STATUSES.has(o.status) && !CANCELLED_STATUSES.has(o.status)
  ).length;
  const completedCount = orders.filter((o) => COMPLETED_STATUSES.has(o.status)).length;

  if (loading)
    return (
      <>
        <Nav />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">Loading account...</div>
        </div>
        <Footer />
      </>
    );

  if (error || !customer)
    return (
      <>
        <Nav />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500">{error || "Unable to load account."}</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-black text-white text-sm font-bold rounded">
            Back to Login
          </button>
        </div>
        <Footer />
      </>
    );

  return (
    <>
      <Nav />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <aside className="space-y-2">
            <div className="bg-black text-white rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="h-8 w-8 text-white" />
              </div>
              <p className="font-black text-lg">{customer.name}</p>
              <p className="text-xs text-white/60 mt-1">{customer.phone}</p>
            </div>
            <nav className="space-y-1">
              {([
                { icon: LayoutGrid, label: "Overview", tab: "overview" as Tab },
                { icon: User, label: "My Profile", tab: "profile" as Tab },
                { icon: Package, label: "My Orders", tab: "orders" as Tab },
                { icon: MapPin, label: "Addresses", tab: "addresses" as Tab },
              ]).map((item) => (
                <button key={item.tab} onClick={() => setActiveTab(item.tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition
                    ${activeTab === item.tab ? "bg-gray-100 text-black" : "text-gray-500 hover:bg-gray-50"}`}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="border border-gray-100 rounded-2xl p-6">
                  <h2 className="text-lg font-black">Welcome back, {customer.name.split(" ")[0]}</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your orders and account from here.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-gray-100 rounded-2xl p-5 text-center">
                    <Package className="h-5 w-5 mx-auto text-gray-400 mb-2" />
                    <p className="text-2xl font-black">{ordersLoading ? "–" : totalOrders}</p>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">Total Orders</p>
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-5 text-center">
                    <Clock className="h-5 w-5 mx-auto text-yellow-500 mb-2" />
                    <p className="text-2xl font-black">{ordersLoading ? "–" : inProgressCount}</p>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">In Progress</p>
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-5 text-center">
                    <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-2" />
                    <p className="text-2xl font-black">{ordersLoading ? "–" : completedCount}</p>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">Completed</p>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-wider">Recent Orders</h3>
                    <button onClick={() => setActiveTab("orders")} className="text-xs font-bold text-gray-500 hover:text-black">
                      View All
                    </button>
                  </div>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-16" />)}
                    </div>
                  ) : orders.length === 0 ? (
                    <EmptyOrdersState />
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 3).map((order) => (
                        <OrderRow key={order.id} order={order} onClick={() => openOrderDetail(order.order_number)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSave} className="border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider mb-5">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="profile-name">Full Name</label>
                    <input
                      id="profile-name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="profile-phone">Phone</label>
                    <input
                      id="profile-phone"
                      type="text"
                      value={customer.phone}
                      readOnly
                      aria-readonly="true"
                      className="w-full mt-1 border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 font-bold text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Your phone number is your account ID and can&apos;t be changed here.</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="profile-email">Email</label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="profile-address">Address</label>
                    <input
                      id="profile-address"
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg disabled:opacity-50 transition"
                  >
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </button>
                  {profileSaved && <span className="text-xs font-bold text-green-600">Saved</span>}
                  {profileSaveError && <span className="text-xs font-bold text-red-500" role="alert">{profileSaveError}</span>}
                </div>
              </form>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider mb-4">My Orders</h2>

                {orders.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Filter orders by status">
                    {availableFilters.map((f) => (
                      <button
                        key={f.key}
                        role="tab"
                        aria-selected={orderFilter === f.key}
                        onClick={() => setOrderFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                          orderFilter === f.key ? "bg-black text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}

                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-20" />)}
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-10">
                    <p className="text-red-500 text-sm mb-3">{ordersError}</p>
                  </div>
                ) : orders.length === 0 ? (
                  <EmptyOrdersState />
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No orders in this status.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => (
                      <OrderRow key={order.id} order={order} onClick={() => openOrderDetail(order.order_number)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-black uppercase tracking-wider">Saved Addresses</h2>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => openAddressModal("new")}
                      className="flex items-center gap-1.5 px-3 py-2 bg-black text-white text-xs font-bold rounded-lg"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Address
                    </button>
                  )}
                </div>

                {addressesLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-32" />)}
                  </div>
                ) : addressesError ? (
                  <p className="text-red-500 text-sm py-6" role="alert">{addressesError}</p>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                    <p className="mb-4">No saved addresses yet.</p>
                    <button onClick={() => openAddressModal("new")} className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg">
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-black">{addr.label}</span>
                          {addr.is_default && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black text-white">DEFAULT</span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-gray-800">{addr.recipient_name}</p>
                        <p className="text-xs text-gray-500">{addr.phone}</p>
                        <p className="text-xs text-gray-500 mt-1">{addr.address}</p>
                        <p className="text-xs text-gray-500">
                          {[addr.area, addr.city].filter(Boolean).join(", ")}{addr.postal_code ? ` - ${addr.postal_code}` : ""}
                        </p>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs font-bold">
                          <button onClick={() => openAddressModal(addr)} className="flex items-center gap-1 text-gray-600 hover:text-black">
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          {!addr.is_default && (
                            <button
                              onClick={() => handleSetDefault(addr)}
                              disabled={addressActionId === addr.id}
                              className="text-gray-600 hover:text-black disabled:opacity-50"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleAddressDelete(addr)}
                            disabled={addressActionId === addr.id}
                            className="flex items-center gap-1 text-red-500 hover:text-red-700 disabled:opacity-50 ml-auto"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {selectedOrderNumber && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeOrderDetail}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black uppercase tracking-wider">Order #{selectedOrderNumber}</h2>
              <button onClick={closeOrderDetail} aria-label="Close order details" className="text-gray-400 hover:text-black">
                <X className="h-5 w-5" />
              </button>
            </div>

            {orderDetailLoading ? (
              <div className="animate-pulse bg-gray-100 rounded-xl h-32" />
            ) : orderDetailError ? (
              <p className="text-red-500 text-sm" role="alert">{orderDetailError}</p>
            ) : orderDetail ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClasses(orderDetail.status)}`}>
                    {orderDetail.status_label}
                  </span>
                  <span className="text-gray-400">
                    {new Date(orderDetail.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Items</h3>
                  <div className="space-y-3">
                    {orderDetail.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        {item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-50 flex-shrink-0" aria-hidden="true" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{item.title}</p>
                          <p className="text-xs text-gray-400">Qty {item.quantity} × Tk {Number(item.price).toLocaleString()}</p>
                        </div>
                        <span className="font-bold">Tk {Number(item.subtotal).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                  <span className="font-black">Total</span>
                  <span className="font-black">Tk {Number(orderDetail.total).toLocaleString()}</span>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Order Status</h3>
                  <ol className="space-y-3">
                    {orderDetail.timeline.map((step, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span
                          className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${step.completed ? "bg-black" : "bg-gray-200"}`}
                          aria-hidden="true"
                        />
                        <span className={step.completed ? "font-bold" : "text-gray-400"}>
                          {step.label}{step.completed ? " — Done" : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                {cancelSuccess && (
                  <p className="text-xs font-bold text-green-600 bg-green-50 rounded-lg px-3 py-2" role="status">
                    Order cancelled.
                  </p>
                )}

                {orderDetail.can_cancel && !cancelSuccess && (
                  <div className="border-t border-gray-100 pt-4">
                    {!cancelConfirming ? (
                      <button
                        type="button"
                        onClick={() => setCancelConfirming(true)}
                        className="w-full px-4 py-2.5 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition"
                      >
                        Cancel Order
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-bold">Cancel this order?</p>
                        <p className="text-xs text-gray-500">This can&apos;t be undone. Any reserved stock will be released.</p>
                        {cancelError && <p className="text-xs font-bold text-red-500" role="alert">{cancelError}</p>}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setCancelConfirming(false)}
                            disabled={cancelling}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-xs font-bold rounded-lg hover:border-black transition disabled:opacity-50"
                          >
                            Keep Order
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                          >
                            {cancelling ? "Cancelling..." : "Cancel Order"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {addressModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setAddressModal(null)}>
          <form
            onSubmit={handleAddressSave}
            className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black uppercase tracking-wider">
                {addressModal === "new" ? "Add Address" : "Edit Address"}
              </h2>
              <button type="button" onClick={() => setAddressModal(null)} aria-label="Close" className="text-gray-400 hover:text-black">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="addr-label">Label</label>
                <select
                  id="addr-label"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition"
                >
                  {["Home", "Office", "Shop", "Other"].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="addr-recipient">Recipient Name</label>
                <input
                  id="addr-recipient"
                  required
                  value={addressForm.recipient_name}
                  onChange={(e) => setAddressForm((f) => ({ ...f, recipient_name: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="addr-phone">Phone</label>
                <input
                  id="addr-phone"
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="addr-address">Address</label>
                <textarea
                  id="addr-address"
                  required
                  rows={2}
                  value={addressForm.address}
                  onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="addr-area">Area</label>
                  <input
                    id="addr-area"
                    value={addressForm.area}
                    onChange={(e) => setAddressForm((f) => ({ ...f, area: e.target.value }))}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="addr-city">City</label>
                  <input
                    id="addr-city"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider" htmlFor="addr-postal">Postal Code</label>
                <input
                  id="addr-postal"
                  value={addressForm.postal_code}
                  onChange={(e) => setAddressForm((f) => ({ ...f, postal_code: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-black transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                type="submit"
                disabled={addressSaving}
                className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg disabled:opacity-50 transition"
              >
                {addressSaving ? "Saving..." : "Save Address"}
              </button>
              {addressSaveError && <span className="text-xs font-bold text-red-500" role="alert">{addressSaveError}</span>}
            </div>
          </form>
        </div>
      )}

      <Footer />
    </>
  );
}

function OrderRow({ order, onClick }: { order: Order; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition"
    >
      <div className="min-w-0">
        <p className="text-sm font-black text-gray-900 truncate">#{order.order_number}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(order.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
        </p>
        <p className="text-xs mt-1">
          <span className={`px-2 py-0.5 rounded-full font-bold ${statusBadgeClasses(order.status)}`}>
            {order.status.replace(/_/g, " ")}
          </span>
          <span className="text-gray-400 ml-2">{(order.items?.length ?? 0)} item{(order.items?.length ?? 0) === 1 ? "" : "s"}</span>
        </p>
      </div>
      <div className="text-right flex items-center gap-2 flex-shrink-0">
        <p className="text-sm font-black text-gray-900">Tk {Number(order.total).toLocaleString()}</p>
        <ChevronRight className="h-4 w-4 text-gray-300" aria-hidden="true" />
      </div>
    </button>
  );
}

function EmptyOrdersState() {
  return (
    <div className="text-center py-10 text-gray-400 text-sm">
      <Package className="h-10 w-10 mx-auto mb-3 text-gray-200" />
      <p className="mb-4">You haven&apos;t placed any orders yet.</p>
      <Link href="/shop" className="inline-block px-4 py-2 bg-black text-white text-xs font-bold rounded-lg">
        Start Shopping
      </Link>
    </div>
  );
}
