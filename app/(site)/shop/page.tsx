import ProductGrid from "../../components/ProductGrid";

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-amber-50 flex flex-col items-center py-12">
      <h1 className="text-3xl font-bold mb-6">SHOP BY CATEGORY</h1>
      <p className="text-gray-600 mb-10">
        Explore our curated collections of luxury jewellery and accessories
      </p>
      <ProductGrid />
    </main>
  );
}
