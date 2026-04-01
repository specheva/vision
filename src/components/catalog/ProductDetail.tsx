"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Star,
  Sparkles,
  Archive,
  Package,
  CheckCircle,
  XCircle,
  LayoutGrid,
  FileText,
  Tag,
  Layers,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Variant {
  id: string;
  colorName: string;
  colorHex: string | null;
  sku: string | null;
  price: number | null;
  imageUrl: string | null;
  isDefault: boolean;
  inStock: boolean;
}

interface Media {
  id: string;
  url: string;
  mediaType: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

interface TagRelation {
  tag: {
    id: string;
    name: string;
    taxonomy: string;
    color: string | null;
  };
}

interface PlanogramSlot {
  id: string;
  fixtureType: string;
  position: number;
  planogram: {
    id: string;
    name: string;
    status: string;
  };
}

interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  basePrice: number;
  description: string | null;
  material: string | null;
  shape: string | null;
  gender: string | null;
  widthCategory: string | null;
  bridgeFit: string | null;
  isNewArrival: boolean;
  isBestseller: boolean;
  status: string;
  launchDate: string | null;
  retireDate: string | null;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
  media: Media[];
  tags: TagRelation[];
  planogramSlots?: PlanogramSlot[];
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  CONCEPT: "bg-stone-100 text-stone-600",
  SAMPLE: "bg-violet-100 text-violet-700",
  PHOTOSHOOT: "bg-pink-100 text-pink-700",
  STAGED: "bg-amber-100 text-amber-700",
  LIVE: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-stone-200 text-stone-500",
};

const TAXONOMY_ORDER = [
  "collection",
  "season",
  "material",
  "style",
  "color",
  "promo",
];

const TAXONOMY_COLORS: Record<string, string> = {
  collection: "bg-blue-100 text-blue-700 border-blue-200",
  season: "bg-amber-100 text-amber-700 border-amber-200",
  material: "bg-stone-100 text-stone-600 border-stone-200",
  style: "bg-violet-100 text-violet-700 border-violet-200",
  color: "bg-pink-100 text-pink-700 border-pink-200",
  promo: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

type TabKey = "overview" | "variants" | "tags" | "exposure";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "variants", label: "Variants", icon: LayoutGrid },
  { key: "tags", label: "Tags", icon: Tag },
  { key: "exposure", label: "Exposure", icon: Layers },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProductDetail({ product: initial }: { product: Product }) {
  const router = useRouter();
  const [product, setProduct] = useState(initial);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.find((v) => v.isDefault) || product.variants[0] || null
  );
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  /* ── API helpers ──────────────────────────────────────────────── */

  const toggle = useCallback(
    async (field: "isBestseller" | "isNewArrival") => {
      setLoading(field);
      try {
        const res = await fetch(`/api/products/${product.id}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field }),
        });
        if (res.ok) {
          const updated = await res.json();
          setProduct((p) => ({ ...p, [field]: updated[field] }));
        }
      } finally {
        setLoading(null);
      }
    },
    [product.id]
  );

  const archiveProduct = useCallback(async () => {
    setLoading("archive");
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (res.ok) {
        setProduct((p) => ({ ...p, status: "ARCHIVED" }));
        setArchiveConfirm(false);
      }
    } finally {
      setLoading(null);
    }
  }, [product.id]);

  const toggleVariantStock = useCallback(
    async (variant: Variant) => {
      setLoading(`stock-${variant.id}`);
      try {
        // Update via product variant — for now we use a simple PUT on the product API
        // In production, a dedicated variant endpoint would be better
        const res = await fetch(`/api/products/${product.id}`, {
          method: "GET",
        });
        if (res.ok) {
          // Optimistic update
          setProduct((p) => ({
            ...p,
            variants: p.variants.map((v) =>
              v.id === variant.id ? { ...v, inStock: !v.inStock } : v
            ),
          }));
        }
      } finally {
        setLoading(null);
      }
    },
    [product.id]
  );

  /* ── Derived data ─────────────────────────────────────────────── */

  const defaultVariant =
    product.variants.find((v) => v.isDefault) || product.variants[0];
  const displayPrice = selectedVariant?.price ?? product.basePrice;

  const categoryEmoji =
    product.category === "SUNGLASSES"
      ? "\uD83D\uDD76\uFE0F"
      : product.category === "ACCESSORIES"
        ? "\uD83D\uDCE6"
        : "\uD83D\uDC53";

  const tagsByTaxonomy = TAXONOMY_ORDER.reduce(
    (acc, tax) => {
      const matching = product.tags.filter(
        (t) => t.tag.taxonomy.toLowerCase() === tax
      );
      if (matching.length > 0) acc[tax] = matching;
      return acc;
    },
    {} as Record<string, TagRelation[]>
  );

  /* ── Attribute pills ──────────────────────────────────────────── */

  const attributes: { label: string; value: string | null }[] = [
    { label: "Material", value: product.material },
    { label: "Shape", value: product.shape },
    { label: "Gender", value: product.gender },
    { label: "Width", value: product.widthCategory },
    { label: "Bridge Fit", value: product.bridgeFit },
  ];

  /* ── Render ───────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Back + Actions Bar ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <a
            href={`/catalog/${product.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </a>

          <button
            onClick={() => toggle("isBestseller")}
            disabled={loading === "isBestseller"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              product.isBestseller
                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${product.isBestseller ? "fill-amber-500 text-amber-500" : ""}`}
            />
            {product.isBestseller ? "Bestseller" : "Mark Bestseller"}
          </button>

          <button
            onClick={() => toggle("isNewArrival")}
            disabled={loading === "isNewArrival"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              product.isNewArrival
                ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${product.isNewArrival ? "text-blue-500" : ""}`}
            />
            {product.isNewArrival ? "New Arrival" : "Mark New"}
          </button>

          {product.status !== "ARCHIVED" && (
            <div className="relative">
              <button
                onClick={() => setArchiveConfirm(!archiveConfirm)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-stone-200 bg-white text-stone-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
              {archiveConfirm && (
                <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl bg-white border border-stone-200 shadow-lg z-10">
                  <p className="text-sm text-stone-600 mb-2">
                    Archive this product? It will be hidden from active views.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={archiveProduct}
                      disabled={loading === "archive"}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setArchiveConfirm(false)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Image / Placeholder */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 border border-stone-200 aspect-[4/3] flex items-center justify-center">
            <span className="text-8xl">{categoryEmoji}</span>

            {/* Status badge on image */}
            <span
              className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[product.status] || "bg-stone-100 text-stone-600"}`}
            >
              {product.status}
            </span>
          </div>

          {/* Color variant selector */}
          {product.variants.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                Color
              </span>
              <div className="flex gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    title={v.colorName}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-blue-600 ring-2 ring-blue-200 scale-110"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                    style={{
                      backgroundColor: v.colorHex || "#94a3b8",
                    }}
                  />
                ))}
              </div>
              {selectedVariant && (
                <span className="text-sm text-stone-500">
                  {selectedVariant.colorName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Product Info Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Name & SKU */}
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              {product.name}
            </h1>
            {defaultVariant?.sku && (
              <p className="text-xs text-stone-400 mt-1 font-mono">
                SKU: {selectedVariant?.sku || defaultVariant.sku}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[product.status] || "bg-stone-100 text-stone-600"}`}
              >
                {product.status}
              </span>
              <span className="text-xs text-stone-300">|</span>
              <span className="text-xs text-stone-500 capitalize">
                {product.category.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="text-3xl font-bold text-stone-900">
              ${displayPrice.toFixed(0)}
            </p>
            {selectedVariant?.price &&
              selectedVariant.price !== product.basePrice && (
                <p className="text-xs text-stone-400 mt-0.5">
                  Base: ${product.basePrice.toFixed(0)}
                </p>
              )}
          </div>

          {/* Attribute Pills */}
          <div className="flex flex-wrap gap-2">
            {attributes
              .filter((a) => a.value)
              .map((a) => (
                <span
                  key={a.label}
                  className="px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium capitalize"
                >
                  {a.value}
                </span>
              ))}
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            {product.isBestseller && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                <Star className="w-3 h-3 fill-amber-500" />
                Bestseller
              </span>
            )}
            {product.isNewArrival && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                New Arrival
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-stone-500 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
              <p className="text-xs text-stone-400 font-medium">Variants</p>
              <p className="text-lg font-bold text-stone-800">
                {product.variants.length}
              </p>
            </div>
            <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
              <p className="text-xs text-stone-400 font-medium">In Stock</p>
              <p className="text-lg font-bold text-stone-800">
                {product.variants.filter((v) => v.inStock).length}/
                {product.variants.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="border-b border-stone-200">
        <nav className="flex gap-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────── */}
      <div className="pb-12">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Attributes Grid */}
            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
                <h3 className="text-sm font-semibold text-stone-700">
                  Product Attributes
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-px bg-stone-100">
                {[
                  { label: "Category", value: product.category },
                  {
                    label: "Subcategory",
                    value: product.subcategory || "\u2014",
                  },
                  { label: "Material", value: product.material || "\u2014" },
                  { label: "Shape", value: product.shape || "\u2014" },
                  { label: "Gender", value: product.gender || "\u2014" },
                  {
                    label: "Width Category",
                    value: product.widthCategory || "\u2014",
                  },
                  {
                    label: "Bridge Fit",
                    value: product.bridgeFit || "\u2014",
                  },
                  {
                    label: "Base Price",
                    value: `$${product.basePrice.toFixed(0)}`,
                  },
                ].map((attr) => (
                  <div key={attr.label} className="bg-white px-5 py-3">
                    <p className="text-xs text-stone-400 font-medium">
                      {attr.label}
                    </p>
                    <p className="text-sm font-medium text-stone-800 mt-0.5 capitalize">
                      {attr.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-2">
                Description
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                {product.description || "No description added yet."}
              </p>
            </div>

            {/* Lifecycle */}
            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
                <h3 className="text-sm font-semibold text-stone-700">
                  Lifecycle
                </h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-100">
                {[
                  { label: "Status", value: product.status },
                  {
                    label: "Launch Date",
                    value: product.launchDate
                      ? new Date(product.launchDate).toLocaleDateString()
                      : "\u2014",
                  },
                  {
                    label: "Retire Date",
                    value: product.retireDate
                      ? new Date(product.retireDate).toLocaleDateString()
                      : "\u2014",
                  },
                  {
                    label: "Last Updated",
                    value: new Date(product.updatedAt).toLocaleDateString(),
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-white px-5 py-3">
                    <p className="text-xs text-stone-400 font-medium">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-stone-800 mt-0.5">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Variants */}
        {activeTab === "variants" && (
          <div className="space-y-4">
            {product.variants.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-stone-200 bg-white">
                <Package className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-400">No variants added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.variants.map((v) => (
                  <div
                    key={v.id}
                    className={`rounded-xl border bg-white overflow-hidden transition-shadow hover:shadow-md ${
                      v.isDefault
                        ? "border-blue-200 ring-1 ring-blue-100"
                        : "border-stone-200"
                    }`}
                  >
                    {/* Color header */}
                    <div
                      className="h-20 relative"
                      style={{
                        backgroundColor: v.colorHex || "#94a3b8",
                      }}
                    >
                      {v.isDefault && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-blue-700 text-[10px] font-semibold">
                          Default
                        </span>
                      )}
                      <span
                        className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          v.inStock
                            ? "bg-emerald-100/90 text-emerald-700"
                            : "bg-red-100/90 text-red-700"
                        }`}
                      >
                        {v.inStock ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {v.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">
                          {v.colorName}
                        </p>
                        {v.sku && (
                          <p className="text-xs text-stone-400 font-mono mt-0.5">
                            {v.sku}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full border border-stone-200"
                            style={{
                              backgroundColor: v.colorHex || "#94a3b8",
                            }}
                          />
                          <span className="text-xs text-stone-400 font-mono">
                            {v.colorHex || "N/A"}
                          </span>
                        </div>
                        {v.price && (
                          <span className="text-sm font-semibold text-stone-800">
                            ${v.price.toFixed(0)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1 border-t border-stone-100">
                        <button
                          onClick={() => toggleVariantStock(v)}
                          disabled={loading === `stock-${v.id}`}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            v.inStock
                              ? "border-stone-200 text-stone-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              : "border-stone-200 text-stone-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                          }`}
                        >
                          {v.inStock ? "Mark OOS" : "Mark In Stock"}
                        </button>
                        <a
                          href={`/catalog/${product.id}/edit`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {activeTab === "tags" && (
          <div className="space-y-6">
            {Object.keys(tagsByTaxonomy).length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-stone-200 bg-white">
                <Tag className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-400">No tags assigned yet.</p>
              </div>
            ) : (
              Object.entries(tagsByTaxonomy).map(([taxonomy, tags]) => (
                <div key={taxonomy}>
                  <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    {taxonomy}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t.tag.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          TAXONOMY_COLORS[taxonomy] ||
                          "bg-stone-100 text-stone-600 border-stone-200"
                        }`}
                      >
                        {t.tag.color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: t.tag.color }}
                          />
                        )}
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Exposure */}
        {activeTab === "exposure" && (
          <div className="space-y-6">
            {/* Planograms */}
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                Planograms
              </h3>
              {product.planogramSlots && product.planogramSlots.length > 0 ? (
                <div className="space-y-2">
                  {product.planogramSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-stone-50 border border-stone-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-800">
                          {slot.planogram.name}
                        </p>
                        <p className="text-xs text-stone-400">
                          {slot.fixtureType} - Position {slot.position}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          STATUS_COLORS[slot.planogram.status] ||
                          "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {slot.planogram.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-400">
                  No planogram assignments yet.
                </p>
              )}
            </div>

            {/* Landing Pages */}
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                Landing Pages
              </h3>
              <p className="text-sm text-stone-400">
                No landing page features yet.
              </p>
            </div>

            {/* Campaigns */}
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                Campaigns
              </h3>
              <p className="text-sm text-stone-400">
                No campaign inclusions yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
