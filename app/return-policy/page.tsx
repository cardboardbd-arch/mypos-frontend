import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { RotateCcw, CheckCircle, XCircle, Clock } from "lucide-react";

export default function ReturnPolicyPage() {
  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[800px] mx-auto px-6 py-10 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <RotateCcw className="h-8 w-8" />
              <h1 className="text-2xl font-black uppercase">Return Policy</h1>
            </div>
            <div className="bg-black text-white rounded-xl p-5 mb-6">
              <p className="text-3xl font-black">7 Days</p>
              <p className="text-white/70 text-sm mt-1">Easy return &amp; exchange policy</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: CheckCircle, color: "text-green-500", title: "Eligible for Return", items: ["Wrong product delivered", "Damaged or defective item", "Product not as described"] },
                { icon: XCircle, color: "text-red-500", title: "Not Eligible", items: ["Used or washed items", "Missing tags or packaging", "After 7 days of delivery"] },
                { icon: Clock, color: "text-blue-500", title: "Refund Timeline", items: ["Exchange: 2-3 days", "bKash/Nagad: 3-5 days", "Bank transfer: 5-7 days"] },
              ].map((s, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <s.icon className={`h-6 w-6 ${s.color} mb-3`} />
                  <h3 className="text-xs font-black uppercase tracking-wider mb-3">{s.title}</h3>
                  <ul className="space-y-1">
                    {s.items.map((item, j) => <li key={j} className="text-xs text-gray-500">• {item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider mb-3">How to Return</h2>
            <ol className="space-y-3">
              {["Contact us within 7 days via phone or email with your order ID.", "Our team will verify your claim and approve the return.", "Pack the item securely and hand it to our courier.", "Refund or exchange will be processed within the timeline above."].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
