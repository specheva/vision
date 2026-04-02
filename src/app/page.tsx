import { prisma } from "@/lib/db";
import {
  Package, Store, Megaphone, Star, Eye, TrendingUp, AlertTriangle,
  Palette, Glasses, ShoppingBag, MapPin, Grid3X3, Sparkles,
  ArrowUpRight, ArrowDownRight, Minus, BarChart3,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // ── Core counts ──────────────────────────────────────────────
  const [
    productCount, liveProductCount, variantCount, oosVariantCount,
    storeCount, activeStoreCount,
    activeCampaignCount, scheduledCampaignCount,
    planogramCount, activePlanogramCount,
    bestsellerCount, newArrivalCount,
    complianceCount, pendingComplianceCount,
    landingPageCount, liveLandingPageCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "LIVE" } }),
    prisma.productVariant.count(),
    prisma.productVariant.count({ where: { inStock: false } }),
    prisma.store.count(),
    prisma.store.count({ where: { isActive: true } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.campaign.count({ where: { status: "SCHEDULED" } }),
    prisma.planogram.count(),
    prisma.planogram.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { isBestseller: true } }),
    prisma.product.count({ where: { isNewArrival: true } }),
    prisma.complianceSubmission.count(),
    prisma.complianceSubmission.count({ where: { status: "PENDING" } }),
    prisma.landingPage.count(),
    prisma.landingPage.count({ where: { status: "LIVE" } }),
  ]);

  // ── Breakdowns ──────────────────────────────────────────────
  const [categoryBreakdown, materialBreakdown, shapeBreakdown, regionBreakdown, formatBreakdown] =
    await Promise.all([
      prisma.product.groupBy({ by: ["category"], _count: true, orderBy: { _count: { category: "desc" } } }),
      prisma.product.groupBy({ by: ["material"], _count: true, where: { material: { not: null } }, orderBy: { _count: { material: "desc" } } }),
      prisma.product.groupBy({ by: ["shape"], _count: true, where: { shape: { not: null } }, orderBy: { _count: { shape: "desc" } } }),
      prisma.store.groupBy({ by: ["region"], _count: true, orderBy: { _count: { region: "desc" } } }),
      prisma.store.groupBy({ by: ["format"], _count: true, orderBy: { _count: { format: "desc" } } }),
    ]);

  // ── Gender split ──────────────────────────────────────────────
  const genderBreakdown = await prisma.product.groupBy({
    by: ["gender"],
    _count: true,
    where: { gender: { not: null }, category: { in: ["FRAMES", "SUNGLASSES"] } },
    orderBy: { _count: { gender: "desc" } },
  });

  // ── Width coverage ──────────────────────────────────────────────
  const widthBreakdown = await prisma.product.groupBy({
    by: ["widthCategory"],
    _count: true,
    where: { widthCategory: { not: null } },
    orderBy: { _count: { widthCategory: "desc" } },
  });

  // ── Variant depth (avg colors per product) ──────────────────
  const avgVariantsPerProduct = variantCount > 0 && productCount > 0
    ? (variantCount / productCount).toFixed(1)
    : "0";

  // ── Planogram coverage ──────────────────────────────────────
  const planogramSlotCount = await prisma.planogramSlot.count();
  const filledSlotCount = await prisma.planogramSlot.count({ where: { productId: { not: null } } });
  const slotFillRate = planogramSlotCount > 0
    ? Math.round((filledSlotCount / planogramSlotCount) * 100)
    : 0;

  // ── Products in planograms (distinct) ──────────────────────
  const productsInPlanograms = await prisma.planogramSlot.findMany({
    where: { productId: { not: null } },
    select: { productId: true },
    distinct: ["productId"],
  });
  const planogramCoverage = productCount > 0
    ? Math.round((productsInPlanograms.length / productCount) * 100)
    : 0;

  // ── Recent products ──────────────────────────────────────────
  const recentProducts = await prisma.product.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { variants: { where: { isDefault: true }, take: 1 } },
  });

  // ── Active campaigns ──────────────────────────────────────────
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: { in: ["ACTIVE", "SCHEDULED"] } },
    take: 5,
    orderBy: { startDate: "asc" },
  });

  // ── Derived insights ──────────────────────────────────────────
  const stockHealthPct = variantCount > 0
    ? Math.round(((variantCount - oosVariantCount) / variantCount) * 100)
    : 100;
  const bestsellerPct = productCount > 0
    ? Math.round((bestsellerCount / productCount) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Warby Parker merchandising intelligence</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Live Products" value={liveProductCount} sub={`${productCount} total · ${newArrivalCount} new arrivals`} href="/catalog" color="blue" />
        <KpiCard icon={Palette} label="Total SKUs" value={variantCount} sub={`${avgVariantsPerProduct} colors/product avg · ${oosVariantCount} OOS`} href="/catalog" color="violet" trend={oosVariantCount > 0 ? "warning" : "ok"} />
        <KpiCard icon={Store} label="Active Stores" value={activeStoreCount} sub={`${storeCount} total · ${formatBreakdown.find(f => f.format === "FLAGSHIP")?._count || 0} flagships`} href="/stores" color="emerald" />
        <KpiCard icon={Grid3X3} label="Planograms" value={activePlanogramCount} sub={`${planogramCount} total · ${slotFillRate}% slots filled`} href="/planograms" color="amber" trend={slotFillRate < 80 ? "warning" : "ok"} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <MiniKpi label="Bestsellers" value={bestsellerCount} sub={`${bestsellerPct}% of catalog`} />
        <MiniKpi label="Campaigns" value={`${activeCampaignCount} live`} sub={`${scheduledCampaignCount} scheduled`} />
        <MiniKpi label="Stock Health" value={`${stockHealthPct}%`} sub={`${oosVariantCount} out of stock`} warning={stockHealthPct < 90} />
        <MiniKpi label="Landing Pages" value={`${liveLandingPageCount} live`} sub={`${landingPageCount} total`} />
        <MiniKpi label="In Planograms" value={`${planogramCoverage}%`} sub={`${productsInPlanograms.length} products`} warning={planogramCoverage < 50} />
        <MiniKpi label="Compliance" value={pendingComplianceCount > 0 ? `${pendingComplianceCount} pending` : "All clear"} sub={`${complianceCount} submissions`} warning={pendingComplianceCount > 0} />
      </div>

      {/* Insights + Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Catalog mix */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-5">
          <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Catalog Mix
          </h2>

          <BreakdownBars label="Category" items={categoryBreakdown.map(c => ({ name: c.category, count: c._count }))} color="blue" />
          <BreakdownBars label="Material" items={materialBreakdown.map(m => ({ name: m.material || "Unknown", count: m._count }))} color="violet" />
          <BreakdownBars label="Shape" items={shapeBreakdown.map(s => ({ name: s.shape || "Unknown", count: s._count }))} color="cyan" />
          <BreakdownBars label="Gender" items={genderBreakdown.map(g => ({ name: g.gender || "Unknown", count: g._count }))} color="pink" />
          <BreakdownBars label="Width" items={widthBreakdown.map(w => ({ name: w.widthCategory || "Unknown", count: w._count }))} color="amber" />
        </div>

        {/* Center: Recent products */}
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-900">Recent Products</h2>
            <Link href="/catalog" className="text-xs text-blue-600 font-medium hover:text-blue-700">View all</Link>
          </div>
          <div className="space-y-2">
            {recentProducts.map((product) => {
              const variant = product.variants[0];
              return (
                <Link key={product.id} href={`/catalog/${product.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-lg flex-shrink-0">
                    {product.category === "ACCESSORIES" ? "📦" : product.category === "SUNGLASSES" ? "🕶️" : "👓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                    <p className="text-xs text-stone-400">${product.basePrice} · {variant?.colorName || product.material}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {product.isBestseller && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    {product.isNewArrival && <Sparkles className="w-3 h-3 text-blue-500" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Store + campaign intel */}
        <div className="space-y-4">
          {/* Store distribution */}
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Store Distribution
            </h2>
            <BreakdownBars label="Region" items={regionBreakdown.map(r => ({ name: r.region, count: r._count }))} color="emerald" />
            <div className="mt-3">
              <BreakdownBars label="Format" items={formatBreakdown.map(f => ({ name: f.format, count: f._count }))} color="blue" />
            </div>
          </div>

          {/* Campaigns */}
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Active Campaigns</h2>
            {activeCampaigns.length > 0 ? (
              <div className="space-y-2">
                {activeCampaigns.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 truncate">{c.name}</p>
                      <p className="text-[10px] text-stone-400 capitalize">{c.status.toLowerCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No active campaigns</p>
            )}
          </div>

          {/* AI Insights */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
            <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Insights
            </h2>
            <div className="space-y-2">
              {generateInsights({
                productCount, variantCount, oosVariantCount, bestsellerCount, bestsellerPct,
                planogramCoverage, slotFillRate, stockHealthPct, newArrivalCount,
                categoryBreakdown, materialBreakdown, storeCount, activePlanogramCount,
              }).map((insight, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white">
                  <insight.icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${insight.color}`} />
                  <p className="text-xs text-stone-600 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Components ────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, href, color, trend }: {
  icon: any; label: string; value: number; sub: string; href: string; color: string; trend?: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <Link href={href} className="rounded-xl border border-stone-200 bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
      </div>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500 mt-0.5">{label}</p>
      <p className="text-[10px] text-stone-400 mt-1">{sub}</p>
    </Link>
  );
}

function MiniKpi({ label, value, sub, warning }: {
  label: string; value: string | number; sub: string; warning?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${warning ? "border-amber-200 bg-amber-50/30" : "border-stone-200 bg-white"}`}>
      <p className={`text-lg font-bold ${warning ? "text-amber-700" : "text-stone-900"}`}>{value}</p>
      <p className="text-[10px] font-medium text-stone-600 mt-0.5">{label}</p>
      <p className="text-[9px] text-stone-400">{sub}</p>
    </div>
  );
}

function BreakdownBars({ label, items, color }: {
  label: string; items: { name: string; count: number }[]; color: string;
}) {
  const max = Math.max(...items.map(i => i.count), 1);
  const barColors: Record<string, string> = {
    blue: "bg-blue-500", emerald: "bg-emerald-500", violet: "bg-violet-500",
    cyan: "bg-cyan-500", pink: "bg-pink-500", amber: "bg-amber-500",
  };

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">{label}</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500 w-20 truncate capitalize">
              {item.name.toLowerCase().replace(/_/g, " ")}
            </span>
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColors[color] || "bg-blue-500"} rounded-full transition-all`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-stone-700 w-5 text-right">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Insight Generator ──────────────────────────────────────────────────

function generateInsights(data: {
  productCount: number; variantCount: number; oosVariantCount: number;
  bestsellerCount: number; bestsellerPct: number; planogramCoverage: number;
  slotFillRate: number; stockHealthPct: number; newArrivalCount: number;
  categoryBreakdown: any[]; materialBreakdown: any[]; storeCount: number;
  activePlanogramCount: number;
}) {
  const insights: { icon: any; text: string; color: string }[] = [];

  // Stock health
  if (data.oosVariantCount > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `${data.oosVariantCount} variant${data.oosVariantCount > 1 ? "s" : ""} currently out of stock (${100 - data.stockHealthPct}% of SKUs). Review inventory allocation.`,
      color: "text-amber-500",
    });
  } else {
    insights.push({
      icon: ArrowUpRight,
      text: `100% stock health — all ${data.variantCount} SKUs are in stock across the catalog.`,
      color: "text-emerald-500",
    });
  }

  // Planogram coverage
  if (data.planogramCoverage < 50) {
    insights.push({
      icon: ArrowDownRight,
      text: `Only ${data.planogramCoverage}% of products appear in active planograms. ${data.productCount - Math.round(data.productCount * data.planogramCoverage / 100)} products have no in-store placement.`,
      color: "text-red-500",
    });
  } else {
    insights.push({
      icon: ArrowUpRight,
      text: `${data.planogramCoverage}% of products have planogram placement. Slot fill rate is ${data.slotFillRate}%.`,
      color: "text-emerald-500",
    });
  }

  // Material dominance
  const topMaterial = data.materialBreakdown[0];
  if (topMaterial) {
    const materialPct = Math.round((topMaterial._count / data.productCount) * 100);
    insights.push({
      icon: materialPct > 70 ? AlertTriangle : Minus,
      text: `${topMaterial.material} accounts for ${materialPct}% of frames. ${materialPct > 70 ? "Consider diversifying material mix." : "Good material diversity."}`,
      color: materialPct > 70 ? "text-amber-500" : "text-blue-500",
    });
  }

  // New arrivals velocity
  if (data.newArrivalCount > 0) {
    insights.push({
      icon: Sparkles,
      text: `${data.newArrivalCount} new arrival${data.newArrivalCount > 1 ? "s" : ""} in the catalog — ${Math.round((data.newArrivalCount / data.productCount) * 100)}% of the assortment is fresh.`,
      color: "text-blue-500",
    });
  }

  // Bestseller concentration
  if (data.bestsellerPct > 40) {
    insights.push({
      icon: AlertTriangle,
      text: `${data.bestsellerPct}% of products marked as bestsellers. Consider tightening the designation to maintain exclusivity.`,
      color: "text-amber-500",
    });
  }

  return insights.slice(0, 4);
}
