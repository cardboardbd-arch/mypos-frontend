import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export default function TermsPage() {
  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[800px] mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-2xl font-black uppercase mb-2">Terms &amp; Conditions</h1>
            <p className="text-xs text-gray-400 mb-6">Last updated: June 2026</p>
            {[
              { title: "Acceptance of Terms", body: "By accessing and using Pixelizz, you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services." },
              { title: "Use of Service", body: "You may use our services only for lawful purposes. You must not use our platform in any way that violates applicable local, national, or international law or regulation." },
              { title: "Orders & Payments", body: "All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order. Payment must be completed before order processing." },
              { title: "Delivery", body: "Delivery times are estimates only. We are not responsible for delays caused by third-party courier services or circumstances beyond our control." },
              { title: "Returns & Refunds", body: "Products may be returned within 7 days of delivery if they are defective or not as described. Refunds will be processed within 5-7 business days." },
              { title: "Changes to Terms", body: "We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated revision date." },
            ].map((s, i) => (
              <div key={i} className="mb-6">
                <h2 className="text-sm font-black uppercase tracking-wider mb-2">{s.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
