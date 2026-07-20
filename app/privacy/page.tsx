import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[800px] mx-auto px-6 py-10 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-2xl font-black uppercase mb-2">Privacy Policy</h1>
            <p className="text-xs text-gray-400 mb-6">Last updated: June 2026</p>
            {[
              { title: "Information We Collect", body: "We collect information you provide directly to us, such as your name, phone number, email address, and delivery address when you create an account or place an order." },
              { title: "How We Use Your Information", body: "We use the information we collect to process your orders, send you order confirmations and updates, and improve our services. We do not sell your personal information to third parties." },
              { title: "Data Security", body: "We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction." },
              { title: "Cookies", body: "We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie settings through your browser." },
              { title: "Contact Us", body: "If you have any questions about this Privacy Policy, please contact us at hello@pixelizz.com or call +880 1700-000000." },
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
