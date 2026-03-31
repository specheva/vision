"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Star, Eye } from "lucide-react";

interface Variant {
  id: string;
  colorName: string;
  colorHex: string | null;
  imageUrl: string | null;
  isDefault: boolean;
}

interface ProductTag {
  tag: { id: string; name: string; taxonomy: string; color: string | null };
}

interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  basePrice: number;
  material: string | null;
  shape: string | null;
  gender: string | null;
  widthCategory: string | null;
  status: string;
  isBestseller: boolean;
  isNewArrival: boolean;
  variants: Variant[];
  tags: ProductTag[];
}

interface Tag {
  id: string;
  name: string;
  taxonomy: string;
}

interface CatalogGridProps {
  products: Product[];
  tags: Tag[];
}

export function CatalogGrid({ products }: CatalogGridProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  const materials = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.material).filter(Boolean))
      ) as string[],
    [products]
  );

  const filtered = useMemo(() => {
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.material?.toLowerCase().includes(q) ||
          p.shape?.toLowerCase().includes(q) ||
          p.variants.some((v) => v.colorName.toLowerCase().includes(q))
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }
    if (materialFilter !== "all") {
      result = result.filter((p) => p.material === materialFilter);
    }
    return result;
  }, [products, search, categoryFilter, materialFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Product Catalog</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {filtered.length} product{filtered.length !== 1 && "s"}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search products, materials, colors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 rounded-xl border transition-colors ${
            showFilters
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-white border border-stone-200">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">
              Category
            </label>
            <div className="flex gap-1.5">
              {["all", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-blue-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {cat === "all" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">
              Material
            </label>
            <div className="flex gap-1.5">
              {["all", ...materials].map((mat) => (
                <button
                  key={mat}
                  onClick={() => setMaterialFilter(mat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    materialFilter === mat
                      ? "bg-blue-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {mat === "all" ? "All" : mat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((product) => {

          return (
            <Link
              key={product.id}
              href={`/catalog/${product.id}`}
              className="group rounded-xl border border-stone-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-40 bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center">
                <span className="text-4xl group-hover:scale-110 transition-transform">
                  {product.category === "ACCESSORIES" ? "📦" : product.category === "SUNGLASSES" ? "🕶️" : "👓"}
                </span>

                {/* Status badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {product.isBestseller && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100/90 text-amber-700 text-[9px] font-semibold">
                      <Star className="w-2.5 h-2.5 fill-amber-500" />
                      Best
                    </span>
                  )}
                  {product.isNewArrival && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-100/90 text-blue-700 text-[9px] font-semibold">
                      New
                    </span>
                  )}
                </div>

                {/* Variant count */}
                {product.variants.length > 1 && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-white/80 text-stone-500 text-[9px] font-medium">
                    {product.variants.length} colors
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-semibold text-stone-900 truncate">
                  {product.name}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  ${product.basePrice} · {product.material || ""}
                  {product.shape ? ` · ${product.shape}` : ""}
                </p>

                {/* Color swatches */}
                {product.variants.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {product.variants.slice(0, 5).map((v) => (
                      <div
                        key={v.id}
                        className="w-4 h-4 rounded-full border border-stone-200"
                        style={{
                          backgroundColor: v.colorHex || "#94a3b8",
                        }}
                        title={v.colorName}
                      />
                    ))}
                    {product.variants.length > 5 && (
                      <span className="text-[9px] text-stone-400 self-center ml-0.5">
                        +{product.variants.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Eye className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400">No products match your filters</p>
        </div>
      )}
    </div>
  );
}
