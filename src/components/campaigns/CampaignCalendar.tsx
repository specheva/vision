"use client";

import { useState } from "react";
import { format, differenceInDays, isWithinInterval, parseISO } from "date-fns";
import { Plus, Calendar, Target, Zap, Tag } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  status: string;
  channels: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface CampaignCalendarProps {
  campaigns: Campaign[];
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
  SCHEDULED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  COMPLETED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
};

const objectiveIcons: Record<string, typeof Target> = {
  awareness: Zap,
  conversion: Target,
  clearance: Tag,
};

export function CampaignCalendar({ campaigns }: CampaignCalendarProps) {
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === filter);

  const statuses = Array.from(new Set(campaigns.map((c) => c.status)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Campaigns</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {campaigns.length} campaign{campaigns.length !== 1 && "s"}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {["all", ...statuses].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {s === "all" ? "All" : s.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Timeline view */}
      <div className="space-y-3">
        {filtered.map((campaign) => {
          const colors = statusColors[campaign.status] || statusColors.DRAFT;
          const ObjIcon = campaign.objective
            ? objectiveIcons[campaign.objective] || Target
            : Calendar;
          const startDate = campaign.startDate
            ? parseISO(campaign.startDate)
            : null;
          const endDate = campaign.endDate
            ? parseISO(campaign.endDate)
            : null;
          const duration =
            startDate && endDate
              ? differenceInDays(endDate, startDate)
              : null;
          const isLive =
            startDate &&
            endDate &&
            isWithinInterval(new Date(), {
              start: startDate,
              end: endDate,
            });
          const channels = campaign.channels
            ? JSON.parse(campaign.channels)
            : [];

          return (
            <div
              key={campaign.id}
              className="rounded-xl border border-stone-200 bg-white p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <ObjIcon className={`w-5 h-5 ${colors.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-stone-900">
                      {campaign.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors.bg} ${colors.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
                      />
                      {campaign.status}
                    </span>
                    {isLive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-semibold animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>

                  {campaign.description && (
                    <p className="text-xs text-stone-500 mb-2">
                      {campaign.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                    {startDate && (
                      <span>
                        {format(startDate, "MMM d")}
                        {endDate && ` — ${format(endDate, "MMM d, yyyy")}`}
                      </span>
                    )}
                    {duration !== null && (
                      <span className="text-stone-400">
                        {duration} day{duration !== 1 && "s"}
                      </span>
                    )}
                    {channels.length > 0 && (
                      <div className="flex gap-1">
                        {channels.map((ch: string) => (
                          <span
                            key={ch}
                            className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 text-[10px] capitalize"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    )}
                    {campaign.objective && (
                      <span className="capitalize text-stone-400">
                        {campaign.objective}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-400">No campaigns found</p>
          </div>
        )}
      </div>
    </div>
  );
}
