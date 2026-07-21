"use client";

import { Suspense } from "react";
import { Nav } from "@/components/site/Nav";
import { PaymentResult } from "@/components/site/PaymentResult";

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <>
          <Nav />
          <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>
        </>
      }
    >
      <PaymentResult />
    </Suspense>
  );
}
