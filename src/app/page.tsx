import { prisma } from "@/lib/db";
import { Package, Store, Megaphone, Star, Eye, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [productCount, storeCount, campaignCount, bestsellerCount] = await Promise.all([
    prisma.product.count(),
    prisma.store.count(),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { isBestseller: true } }),
  ]);

  const recentProducts = await prisma.product.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { variants: { where: { isDefault: true }, take: 1 }, tags: { include: { tag: true }, take: 3 } },
  });

  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: { in: ["ACTIVE", "SCHEDULED"] } },
    take: 5,
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Warby Parker merchandising overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Products", value: productCount, href: "/catalog", color: "bg-blue-50 text-blue-600" },
          { icon: Store, label: "Stores", value: storeCount, href: "/stores", color: "bg-emerald-50 text-emerald-600" },
          { icon: Megaphone, label: "Active Campaigns", value: campaignCount, href: "/campaigns", color: "bg-purple-50 text-purple-600" },
          { icon: Star, label: "Bestsellers", value: bestsellerCount, href: "/catalog", color: "bg-amber-50 text-amber-600" },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="rounded-xl border border-stone-200 bg-white p-4 hover:shadow-sm transition-shadow">
            <div className={`w-8 h-8 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{kpi.value}</p>
            <p className="text-xs text-stone-500 mt-0.5">{kpi.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-900">Recent Products</h2>
            <Link href="/catalog" className="text-xs text-blue-600 font-medium hover:text-blue-700">View all</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recentProducts.map((product) => {
              const variant = product.variants[0];
              return (
                <Link key={product.id} href={`/catalog/${product.id}`}
                  className="rounded-lg border border-stone-100 p-3 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="w-full h-20 rounded-md bg-stone-100 mb-2 flex items-center justify-center text-2xl">
                    {product.category === "ACCESSORIES" ? "📦" : "👓"}
                  </div>
                  <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                  <p className="text-xs text-stone-400">${product.basePrice} · {variant?.colorName || product.material}</p>
                  <div className="flex gap-1 mt-1.5">
                    {product.isBestseller && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">Bestseller</span>}
                    {product.isNewArrival && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">New</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Campaigns</h2>
            {activeCampaigns.length > 0 ? (
              <div className="space-y-2">
                {activeCampaigns.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50">
                    <div className={`w-2 h-2 rounded-full ${c.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400"}`} />
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
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Quick Actions</h2>
            <div className="space-y-1.5">
              <Link href="/catalog" className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 text-sm text-stone-600"><Eye className="w-4 h-4" />Browse catalog</Link>
              <Link href="/planograms" className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 text-sm text-stone-600"><TrendingUp className="w-4 h-4" />View planograms</Link>
              <Link href="/stores" className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 text-sm text-stone-600"><AlertTriangle className="w-4 h-4" />Store compliance</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
