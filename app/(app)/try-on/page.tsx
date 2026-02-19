"use client";

import FaceTryOn from "../../components/FaceTryOn"; // or "@/components/FaceTryOn" if your alias supports it

export default function Page() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Try On</h1>
      <FaceTryOn />
    </main>
  );
}
