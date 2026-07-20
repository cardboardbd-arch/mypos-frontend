"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { getProfile, logoutCustomer, getMyOrders, getToken, removeToken } from "@/lib/auth";
import { User, Package, MapPin, LogOut, ChevronRight, ExternalLink } from "lucide-react";

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
  items?: any[];
}

type Tab = "profile" | "orders" | "addresses";

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const token = getToken();

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    getProfile(token).then(data => {
      if (data.id) setCustomer(data as Customer);
      else { removeToken(); router.push("/login"); }
      setLoading(false);
    }).catch((err) => {
      setError(err.message || "Failed to load profile");
      setLoading(false);
      if (err.message === "UNAUTHORIZED") {
        removeToken();
        router.push("/login");
      }
    });
  }, [router, token]);

  const loadOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const data = await getMyOrders(token);
      setOrders((data.data as Order[]) ?? []);
    } catch (err: any) {
      setOrdersError(err.message || "Failed to load orders");
      if (err.message === "UNAUTHORIZED") {
        removeToken();
        router.push("/login");
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setError("");
    if (tab === "orders" && orders.length === 0 && !ordersLoading) {
      loadOrders();
    }
  };

  const handleLogout = async () => {
    if (token) await logoutCustomer(token).catch(() => {});
    removeToken();
    router.push("/");
  };

  if (loading)
    return (
      <>
        <Nav />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">Loading profile...</div>
        </div>
        <Footer />
      </>
    );

  if (error || !customer)
    return (
      <>
        <Nav />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500">{error || "Unable to load profile."}</p>
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
                { icon: User, label: "My Profile", tab: "profile" as Tab },
                { icon: Package, label: "My Orders", tab: "orders" as Tab },
                { icon: MapPin, label: "Addresses", tab: "addresses" as Tab },
              ]).map((item) => (
                <button key={item.tab} onClick={() => handleTabChange(item.tab)}
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

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider mb-5">Profile Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Full Name</p>
                    <p className="font-bold mt-1">{customer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Phone</p>
                    <p className="font-bold mt-1">{customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                    <p className="font-bold mt-1">{customer.email ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">City</p>
                    <p className="font-bold mt-1">—</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Not provided by backend</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Address</p>
                    <p className="font-bold mt-1">{customer.address ?? "—"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider mb-5">My Orders</h2>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-20" />
                    ))}
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-10">
                    <p className="text-red-500 text-sm mb-3">{ordersError}</p>
                    <button onClick={loadOrders} className="px-4 py-2 bg-black text-white text-sm font-bold rounded">
                      Retry
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    <Package className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                    No orders yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition">
                        <div>
                          <p className="text-sm font-black text-gray-900">#{order.order_number}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {order.status.replace(/_/g, " ")} • {order.payment_method.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900">Tk {Number(order.total).toLocaleString()}</p>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            order.payment_status === "paid"
                              ? "bg-green-50 text-green-600"
                              : "bg-yellow-50 text-yellow-700"
                          }`}>
                            {order.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider mb-5">Saved Addresses</h2>
                <div className="text-center py-10 text-gray-400 text-sm">
                  <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                  <p className="mb-1">No saved addresses.</p>
                  <p className="text-xs text-gray-400">Address book API is not yet available.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
