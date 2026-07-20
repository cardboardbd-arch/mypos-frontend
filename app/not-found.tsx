import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center max-w-md w-full">
          <p className="text-8xl font-black text-gray-100 mb-4">404</p>
          <h2 className="text-xl font-black uppercase mb-2">Page Not Found</h2>
          <p className="text-gray-400 text-sm mb-8">The page you are looking for doesn&apos;t exist or has been moved.</p>
          <Link href="/" className="bg-black text-white px-8 py-3 text-sm font-black uppercase tracking-widest rounded-sm hover:bg-gray-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
