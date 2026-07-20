import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export default function AboutPage() {
  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="relative h-64 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80" alt="About" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">About Us</h1>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 space-y-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-black uppercase mb-4">Our Story</h2>
            <p className="text-gray-600 text-sm leading-relaxed">Pixelizz Business OS was born from a simple idea — to make running a business in Bangladesh easier, smarter, and more connected. We started as a small team of developers and entrepreneurs who understood the real challenges local businesses face every day.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black text-white rounded-2xl p-8 shadow-sm">
              <div className="text-3xl mb-3">🎯</div>
              <h2 className="text-xl font-black uppercase mb-3">Our Mission</h2>
              <p className="text-white/70 text-sm leading-relaxed">To empower every business in Bangladesh with world-class digital tools that are affordable and built for their needs.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <div className="text-3xl mb-3">🚀</div>
              <h2 className="text-xl font-black uppercase mb-3">Our Vision</h2>
              <p className="text-gray-600 text-sm leading-relaxed">To become Bangladesh&apos;s leading Business OS — where inventory, sales, eCommerce, and intelligence come together seamlessly.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[["500+","Happy Businesses"],["50K+","Orders Processed"],["8+","Cities Covered"],["24/7","Customer Support"]].map(([v,l],i) => (
                <div key={i}><p className="text-3xl font-black">{v}</p><p className="text-xs text-gray-400 uppercase tracking-wider mt-1">{l}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
