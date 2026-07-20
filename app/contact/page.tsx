"use client";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.message) return;
    setSent(true);
  };

  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Contact Us</h1>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {[
                { icon: MapPin, title: "Address", value: "Dhaka, Bangladesh" },
                { icon: Phone, title: "Phone", value: "+880 1700-000000" },
                { icon: Mail, title: "Email", value: "hello@pixelizz.com" },
                { icon: Clock, title: "Hours", value: "Sat–Thu: 9AM – 9PM" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400">{item.title}</p>
                    <p className="text-sm font-bold mt-1">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm">
              {sent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-xl font-black uppercase mb-2">Message Sent!</h2>
                  <p className="text-gray-500 text-sm">We will get back to you within 24 hours.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black uppercase mb-6">Send a Message</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name *</label>
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name"
                          className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                        <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="01XXXXXXXXX"
                          className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                      <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com"
                        className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
                      <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="How can we help?"
                        className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message *</label>
                      <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={5} placeholder="Write your message..."
                        className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition resize-none" />
                    </div>
                    <button onClick={handleSubmit}
                      className="w-full bg-black hover:bg-gray-800 text-white py-3.5 text-sm font-black uppercase tracking-widest rounded-sm transition">
                      Send Message →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
