"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { loginCustomer, saveToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.phone || !form.password) { setError("Phone and password required."); return; }
    setLoading(true); setError("");
    try {
      const res = await loginCustomer(form);
      if (res.token) {
        saveToken(res.token);
        router.push("/profile");
      } else {
        setError(res.message ?? "Login failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Sign In</h1>
          <p className="text-sm text-gray-400 mb-8">Welcome back! Enter your details below.</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition"
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="mt-6 w-full bg-black hover:bg-gray-800 text-white py-3.5 text-sm font-black uppercase tracking-widest rounded-sm transition disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-black font-bold hover:underline">Create Account</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
