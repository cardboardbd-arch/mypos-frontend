"use client";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { q: "How do I place an order?", a: "Browse our shop, select your product, choose size/variant, and click Buy Now or Add to Cart. Then proceed to checkout and fill in your delivery details." },
  { q: "What payment methods do you accept?", a: "We accept Cash on Delivery (COD), bKash, Nagad, Rocket, and Card payments via SSLCommerz." },
  { q: "How long does delivery take?", a: "Inside Dhaka: 1-2 business days. Outside Dhaka: 3-5 business days. Express delivery options are available for select areas." },
  { q: "What is your return policy?", a: "We offer a 7-day easy return policy. If you receive a damaged or wrong product, contact us within 7 days of delivery for a free exchange or refund." },
  { q: "How do I track my order?", a: "After your order is shipped, you will receive an SMS with your tracking number. You can also track your order from your profile page under My Orders." },
  { q: "Can I cancel my order?", a: "Yes, you can cancel your order before it is shipped. Once shipped, cancellation is not possible. Please contact our support team immediately." },
  { q: "Do you offer wholesale or bulk pricing?", a: "Yes! We have a B2B Wholesale Portal for dealers and bulk buyers. Contact us to register as a dealer and get access to wholesale pricing." },
  { q: "How do I contact customer support?", a: "You can reach us via phone at +880 1700-000000, email at hello@pixelizz.com, or through our Contact Us page. We are available Sat–Thu, 9AM–9PM." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">FAQ</h1>
          </div>
        </div>
        <div className="max-w-[800px] mx-auto px-6 py-10 space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left">
                <span className="text-sm font-black uppercase tracking-wide">{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 shrink-0 ml-4 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
