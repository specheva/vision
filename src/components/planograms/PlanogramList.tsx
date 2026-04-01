"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
}

interface PlanogramSlot {
  id: string;
  fixtureType: string;
  position: number;
  productId: string | null;
  notes: string | null;
  product: Product | null;
}

interface Cluster {
  id: string;
  name: string;
  clusterType: string;
}

interface ClusterAssignment {
  cluster: Cluster;
}

interface Planogram {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: string;
  layoutData: string | null;
  instructions: string | null;
  complianceDeadline: string | null;
  createdAt: string;
  updatedAt: string;
  slots: PlanogramSlot[];
  clusterAssignments: ClusterAssignment[];
}

interface PlanogramListProps {
  planograms: Planogram[];
}

const STATUSES = ["DRAFT", "REVIEW", "APPROVED", "ACTIVE", "RETIRED"];

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  REVIEW: "Review",
  APPROVED: "Approved",
  ACTIVE: "Active",
  RETIRED: "Retired",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-600",
  REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  RETIRED: "bg-red-100 text-red-700",
};

const fixtureLabels: Record<string, string> = {
  WALL_UNIT: "Wall Unit",
  DISPLAY_TABLE: "Display Table",
  COUNTER: "Counter",
  WINDOW_BAY: "Window Bay",
};

const productEmoji: Record<string, string> = {
  FRAMES: "👓",
  SUNGLASSES: "🕶️",
  ACCESSORIES: "📦",
  CARE: "✨",
};

export function PlanogramList({ planograms }: PlanogramListProps) {
  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleStatus = (status: string) => {
    const next = new Set(statusFilters);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    setStatusFilters(next);
  };

  const filtered = useMemo(() => {
    let result = planograms;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (statusFilters.size > 0) {
      result = result.filter((p) => statusFilters.has(p.status));
    }

    return result;
  }, [planograms, search, statusFilters]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Planograms</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {filtered.length} planogram{filtered.length !== 1 && "s"}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search planograms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Status Filters */}
      <div>
        <p className="text-xs font-medium text-stone-500 mb-1.5">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilters.has(s)
                  ? "bg-blue-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Planogram Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((planogram) => {
          const isExpanded = expandedId === planogram.id;
          const filledSlots = planogram.slots.filter((s) => s.product);
          const previewProducts = filledSlots.slice(0, 6);

          return (
            <div
              key={planogram.id}
              className="rounded-xl border border-stone-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : planogram.id)
                }
                className="w-full text-left p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-900 truncate">
                        {planogram.name}
                      </h3>
                      <span className="text-[10px] text-stone-400 flex-shrink-0">
                        v{planogram.version}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          statusColors[planogram.status] ||
                          "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {statusLabels[planogram.status] || planogram.status}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Layers className="w-3 h-3" />
                        {planogram.slots.length} slot
                        {planogram.slots.length !== 1 && "s"}
                      </span>
                    </div>

                    {/* Cluster pills */}
                    {planogram.clusterAssignments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {planogram.clusterAssignments.map((ca) => (
                          <span
                            key={ca.cluster.id}
                            className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium"
                          >
                            {ca.cluster.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Compliance deadline */}
                    {planogram.complianceDeadline && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-stone-400">
                        <Calendar className="w-3 h-3" />
                        <span>Due {formatDate(planogram.complianceDeadline)}</span>
                      </div>
                    )}

                    {/* Product preview */}
                    {previewProducts.length > 0 && (
                      <div className="flex items-center gap-1 mt-2.5">
                        {previewProducts.map((slot) => (
                          <span
                            key={slot.id}
                            className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-xs"
                            title={slot.product?.name || ""}
                          >
                            {productEmoji[slot.product?.category || ""] || "👓"}
                          </span>
                        ))}
                        {filledSlots.length > 6 && (
                          <span className="text-[10px] text-stone-400 ml-0.5">
                            +{filledSlots.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-2 flex-shrink-0 text-stone-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-stone-100 pt-3 space-y-4">
                  {/* Description */}
                  {planogram.description && (
                    <p className="text-xs text-stone-500">
                      {planogram.description}
                    </p>
                  )}

                  {/* Instructions */}
                  {planogram.instructions && (
                    <div>
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                        Instructions
                      </p>
                      <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">
                        {planogram.instructions}
                      </p>
                    </div>
                  )}

                  {/* Slot List */}
                  {planogram.slots.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                        Slots
                      </p>
                      <div className="space-y-1">
                        {planogram.slots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-stone-50 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-stone-400 w-5 text-right">
                                {slot.position}
                              </span>
                              <span className="text-stone-500">
                                {fixtureLabels[slot.fixtureType] ||
                                  slot.fixtureType}
                              </span>
                            </div>
                            <span
                              className={
                                slot.product
                                  ? "text-stone-700 font-medium"
                                  : "text-stone-400 italic"
                              }
                            >
                              {slot.product ? slot.product.name : "Empty"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cluster Assignments */}
                  {planogram.clusterAssignments.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                        Assigned Clusters
                      </p>
                      <div className="space-y-1">
                        {planogram.clusterAssignments.map((ca) => (
                          <div
                            key={ca.cluster.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-stone-700">
                              {ca.cluster.name}
                            </span>
                            <span className="text-stone-400 capitalize">
                              {ca.cluster.clusterType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Grid3X3 className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400">No planograms match your filters</p>
        </div>
      )}
    </div>
  );
}
