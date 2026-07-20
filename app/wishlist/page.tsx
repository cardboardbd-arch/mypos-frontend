"use client";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function WishlistPage() {
  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-6">My Wishlist</h1>
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <Heart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-sm mb-6">Your wishlist is empty.</p>
            <Link href="/shop" className="bg-black text-white px-8 py-3 text-sm font-black uppercase tracking-widest rounded-sm hover:bg-gray-800 transition">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
