"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, Building2, ChevronDown, ChevronUp } from "lucide-react";

interface Cluster {
  id: string;
  name: string;
  clusterType: string;
}

interface ClusterAssignment {
  cluster: Cluster;
}

interface Store {
  id: string;
  storeCode: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
  zipCode: string | null;
  region: string;
  format: string;
  isActive: boolean;
  clusterAssignments: ClusterAssignment[];
}

interface StoreDirectoryProps {
  stores: Store[];
}

const REGIONS = ["Northeast", "Southeast", "Midwest", "West", "Southwest"];
const FORMATS = ["FLAGSHIP", "STANDARD", "SHOP_IN_SHOP"];

const formatLabels: Record<string, string> = {
  FLAGSHIP: "Flagship",
  STANDARD: "Standard",
  SHOP_IN_SHOP: "Shop-in-Shop",
};

const formatColors: Record<string, string> = {
  FLAGSHIP: "bg-blue-100 text-blue-700",
  STANDARD: "bg-stone-100 text-stone-600",
  SHOP_IN_SHOP: "bg-amber-100 text-amber-700",
};

export function StoreDirectory({ stores }: StoreDirectoryProps) {
  const [search, setSearch] = useState("");
  const [regionFilters, setRegionFilters] = useState<Set<string>>(new Set());
  const [formatFilters, setFormatFilters] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFilter = (
    set: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string
  ) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const filtered = useMemo(() => {
    let result = stores;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.storeCode.toLowerCase().includes(q)
      );
    }

    if (regionFilters.size > 0) {
      result = result.filter((s) => regionFilters.has(s.region));
    }

    if (formatFilters.size > 0) {
      result = result.filter((s) => formatFilters.has(s.format));
    }

    return result;
  }, [stores, search, regionFilters, formatFilters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Store Directory</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {filtered.length} store{filtered.length !== 1 && "s"}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search by name, city, state, or store code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter Chips */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-stone-500 mb-1.5">Region</p>
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => toggleFilter(regionFilters, setRegionFilters, r)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  regionFilters.has(r)
                    ? "bg-blue-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-stone-500 mb-1.5">Format</p>
          <div className="flex flex-wrap gap-1.5">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => toggleFilter(formatFilters, setFormatFilters, f)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  formatFilters.has(f)
                    ? "bg-blue-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {formatLabels[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((store) => {
          const isExpanded = expandedId === store.id;
          return (
            <div
              key={store.id}
              className="rounded-xl border border-stone-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : store.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          store.isActive ? "bg-emerald-500" : "bg-stone-300"
                        }`}
                      />
                      <h3 className="text-sm font-semibold text-stone-900 truncate">
                        {store.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 mt-1.5 text-xs text-stone-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>
                        {store.city}, {store.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          formatColors[store.format] || "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {formatLabels[store.format] || store.format}
                      </span>
                      <span className="text-[10px] text-stone-400">{store.region}</span>
                    </div>

                    {store.clusterAssignments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {store.clusterAssignments.map((ca) => (
                          <span
                            key={ca.cluster.id}
                            className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium"
                          >
                            {ca.cluster.name}
                          </span>
                        ))}
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
                <div className="px-4 pb-4 border-t border-stone-100 pt-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <Building2 className="w-3 h-3" />
                    <span className="font-mono text-stone-600">
                      {store.storeCode}
                    </span>
                  </div>

                  {store.address && (
                    <p className="text-xs text-stone-500">{store.address}</p>
                  )}
                  {store.zipCode && (
                    <p className="text-xs text-stone-500">
                      {store.city}, {store.state} {store.zipCode}
                    </p>
                  )}

                  {store.clusterAssignments.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                        Clusters
                      </p>
                      <div className="space-y-1">
                        {store.clusterAssignments.map((ca) => (
                          <div
                            key={ca.cluster.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-stone-700">{ca.cluster.name}</span>
                            <span className="text-stone-400 capitalize">
                              {ca.cluster.clusterType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        store.isActive ? "bg-emerald-500" : "bg-stone-300"
                      }`}
                    />
                    <span className="text-[10px] text-stone-500">
                      {store.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <MapPin className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400">No stores match your filters</p>
        </div>
      )}
    </div>
  );
}
