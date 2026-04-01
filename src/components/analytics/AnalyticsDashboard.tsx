"use client";

import { Package, Store, Megaphone, Grid3X3, TrendingUp } from "lucide-react";

interface AnalyticsDashboardProps {
  stats: {
    productCount: number;
    storeCount: number;
    campaignCount: number;
    planogramCount: number;
  };
  categoryBreakdown: { category: string; _count: number }[];
  regionBreakdown: { region: string; _count: number }[];
}

export function AnalyticsDashboard({
  stats,
  categoryBreakdown,
  regionBreakdown,
}: AnalyticsDashboardProps) {
  const maxCategory = Math.max(...categoryBreakdown.map((c) => c._count), 1);
  const maxRegion = Math.max(...regionBreakdown.map((r) => r._count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Merchandising performance overview
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Products", value: stats.productCount, color: "bg-blue-50 text-blue-600" },
          { icon: Store, label: "Stores", value: stats.storeCount, color: "bg-emerald-50 text-emerald-600" },
          { icon: Megaphone, label: "Campaigns", value: stats.campaignCount, color: "bg-purple-50 text-purple-600" },
          { icon: Grid3X3, label: "Planograms", value: stats.planogramCount, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-stone-900 mb-4">
            Products by Category
          </h2>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-stone-600 capitalize">
                    {cat.category.toLowerCase()}
                  </span>
                  <span className="text-xs font-semibold text-stone-900">
                    {cat._count}
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(cat._count / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-stone-900 mb-4">
            Stores by Region
          </h2>
          <div className="space-y-3">
            {regionBreakdown.map((reg) => (
              <div key={reg.region}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-stone-600">{reg.region}</span>
                  <span className="text-xs font-semibold text-stone-900">
                    {reg._count}
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(reg._count / maxRegion) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights placeholder */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-stone-900">AI Insights</h2>
        </div>
        <div className="space-y-2">
          {[
            "Acetate frames account for 60% of inventory but drive 72% of sell-through",
            "Northeast stores show 15% higher conversion on round frames vs. national average",
            "Spring 2026 collection launch is trending 8% ahead of Spring 2025 at same point",
          ].map((insight, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
              </div>
              <p className="text-sm text-stone-700">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
