"use client";

import { useState } from "react";
import {
  Globe,
  FileText,
  ArrowUpDown,
  Pin,
  Plus,
  ExternalLink,
  Eye,
} from "lucide-react";

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishAt: string | null;
  unpublishAt: string | null;
}

interface MerchRule {
  id: string;
  category: string;
  ruleType: string;
  position: number | null;
  weight: number | null;
  sortField: string | null;
  sortDirection: string | null;
}

interface CategoryPinItem {
  id: string;
  category: string;
  position: number;
  product: { id: string; name: string; slug: string };
}

interface OnlineMerchProps {
  landingPages: LandingPage[];
  merchRules: MerchRule[];
  categoryPins: CategoryPinItem[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-600",
  SCHEDULED: "bg-amber-50 text-amber-700",
  LIVE: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-red-50 text-red-600",
};

export function OnlineMerch({
  landingPages,
  merchRules,
  categoryPins,
}: OnlineMerchProps) {
  const [tab, setTab] = useState<"pages" | "rules" | "pins">("pages");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Online Merchandising
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Manage landing pages, category rules, and product pins
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-stone-200">
        {[
          {
            key: "pages" as const,
            label: "Landing Pages",
            icon: FileText,
            count: landingPages.length,
          },
          {
            key: "rules" as const,
            label: "Sort Rules",
            icon: ArrowUpDown,
            count: merchRules.length,
          },
          {
            key: "pins" as const,
            label: "Product Pins",
            icon: Pin,
            count: categoryPins.length,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                tab === t.key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Landing Pages */}
      {tab === "pages" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Page
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {landingPages.map((page) => (
              <div
                key={page.id}
                className="rounded-xl border border-stone-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">
                      {page.title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      /{page.slug}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      statusColors[page.status] || statusColors.DRAFT
                    }`}
                  >
                    {page.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs hover:bg-stone-200">
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs hover:bg-stone-200">
                    <ExternalLink className="w-3 h-3" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sort Rules */}
      {tab === "rules" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          </div>
          {merchRules.length > 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase">
                      Category
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase">
                      Rule Type
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {merchRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-stone-100 last:border-0"
                    >
                      <td className="px-4 py-3 text-stone-700 capitalize">
                        {rule.category}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                          {rule.ruleType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
                        {rule.ruleType === "SORT" &&
                          `${rule.sortField} ${rule.sortDirection}`}
                        {rule.ruleType === "BOOST" &&
                          `Weight: +${rule.weight}`}
                        {rule.ruleType === "BURY" &&
                          `Weight: ${rule.weight}`}
                        {rule.ruleType === "PIN" &&
                          `Position ${rule.position}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl border border-stone-200 bg-white">
              <ArrowUpDown className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-400">No sort rules configured</p>
            </div>
          )}
        </div>
      )}

      {/* Product Pins */}
      {tab === "pins" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Pin Product
            </button>
          </div>
          {categoryPins.length > 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase">
                      Position
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase">
                      Category
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase">
                      Product
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryPins.map((pin) => (
                    <tr
                      key={pin.id}
                      className="border-b border-stone-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold inline-flex items-center justify-center">
                          {pin.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-700 capitalize">
                        {pin.category}
                      </td>
                      <td className="px-4 py-3 text-stone-700 font-medium">
                        {pin.product.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl border border-stone-200 bg-white">
              <Pin className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-400">No products pinned</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
