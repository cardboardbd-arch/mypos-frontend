"use client";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Trash2, Plus, Minus, ShoppingBag, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatItemAttributes } from "@/lib/attributes";

export default function CartPage() {
  const { items, cartCount, cartTotal, loading, error, refreshCart, updateQuantity, removeFromCart, clearCart } = useCart();

  if (loading) {
    return (
      <>
        <Nav />
        <div className="bg-[#e8e8e8] min-h-screen">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
            <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Shopping Cart ({cartCount})</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-4 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-24 animate-pulse">
                <div className="h-6 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Nav />
        <div className="bg-[#e8e8e8] min-h-screen">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
            <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Shopping Cart</h1>
            <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button onClick={refreshCart} className="px-4 py-2 bg-black text-white text-sm font-bold rounded flex items-center gap-2 mx-auto">
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Nav />
        <div className="bg-[#e8e8e8] min-h-screen">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
            <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Shopping Cart ({cartCount})</h1>
            <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-6">Your cart is empty.</p>
              <Link href="/shop" className="bg-black text-white px-8 py-3 text-sm font-black uppercase tracking-widest rounded-sm hover:bg-gray-800 transition">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const subtotal = cartTotal;
  const delivery = 60;
  const total = subtotal + delivery;

  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Shopping Cart ({cartCount})</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.variantId} className="bg-white rounded-2xl shadow-sm p-5 flex gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center overflow-hidden">
                    {item.thumbnail
                      ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.slug}`} className="text-sm font-black hover:underline line-clamp-1">{item.name}</Link>
                    {formatItemAttributes(item.attributes) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatItemAttributes(item.attributes)}
                      </p>
                    )}
                    <p className="text-sm font-black mt-1">Tk {item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="px-3 py-2 hover:bg-gray-50 rounded-l-lg transition"><Minus className="h-3 w-3" /></button>
                      <span className="px-3 py-2 text-sm font-black border-x border-gray-200">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="px-3 py-2 hover:bg-gray-50 rounded-r-lg transition"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.variantId)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition text-gray-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm font-black w-24 text-right">Tk {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
              <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-bold mt-2">Clear Cart</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-24">
              <h2 className="text-sm font-black uppercase tracking-wider mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold">Tk {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="font-bold">Tk {delivery}</span></div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-black uppercase">Total</span>
                  <span className="font-black text-lg">Tk {total.toLocaleString()}</span>
                </div>
              </div>
              <Link href="/checkout" className="mt-6 block w-full bg-black hover:bg-gray-800 text-white py-3.5 text-sm font-black uppercase tracking-widest rounded-sm transition text-center">
                Proceed to Checkout →
              </Link>
              <Link href="/shop" className="mt-3 block w-full border border-gray-200 text-gray-600 py-3 text-sm font-bold uppercase tracking-wider rounded-sm transition text-center hover:border-black hover:text-black">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
