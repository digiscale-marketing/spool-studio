"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { analyticsApi } from "@/lib/api-client"

const PERIODS = [7, 10, 30] as const

function lagLabel(hours: number | null): string {
  if (hours === null) return "—"
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 48) return `${hours}h`
  return `${Math.round((hours / 24) * 10) / 10}d`
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<number>(10)
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "designers", days],
    queryFn: () => analyticsApi.designers(days),
  })
  const rows = data?.rows ?? []

  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: "var(--color-bg-app)",
        minHeight: "100vh",
        margin: "-24px",
        padding: "32px",
      }}
    >
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Analytics" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-white">
            Designer Analytics
          </h1>
          <p className="mt-1 text-[13px] text-[#71717a]">
            Upload volume, rework, and approval speed per designer.
          </p>
        </div>
        <div className="flex items-center gap-1 border-b border-[rgba(255,255,255,0.05)]">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              className={cn(
                "px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all cursor-pointer",
                days === p
                  ? "border-[var(--primary)] text-white font-semibold"
                  : "border-transparent text-[#71717a] hover:text-[#a1a1aa]",
              )}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-[#71717a]">
          Loading analytics…
        </p>
      ) : rows.length === 0 ? (
        <Card className="rounded-[10px] border-0 bg-[#161616] p-8 shadow-none">
          <p className="text-center text-[13px] text-[#71717a]">
            No designer activity in the last {data?.days ?? days} days.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card
              key={r.userId}
              className="rounded-[10px] border-0 bg-[#161616] p-5 shadow-none"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-medium text-white">{r.name}</h2>
                <Badge
                  className={cn(
                    "border-0 text-[10px]",
                    r.revisionRate >= 50
                      ? "bg-red-400/10 text-red-400"
                      : r.revisionRate >= 25
                        ? "bg-amber-400/10 text-amber-400"
                        : "bg-emerald-400/10 text-emerald-400",
                  )}
                >
                  {r.revisionRate}% sent back
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: `Uploads · ${r.reels.uploads}R + ${r.posters.uploads}P`,
                    value: String(r.uploads),
                  },
                  {
                    label: `Sent back · ${r.reels.revisions}R + ${r.posters.revisions}P`,
                    value: String(r.revisions),
                  },
                  {
                    label: `Published · ${r.reels.published}R + ${r.posters.published}P`,
                    value: String(r.published),
                  },
                  { label: "Avg approval", value: lagLabel(r.avgApprovalLagHours) },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#1a1a1a] p-3 text-center"
                  >
                    <p className="text-[18px] font-semibold text-white">
                      {s.value}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[#71717a]">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(
                  [
                    { kind: "Reels", s: r.reels },
                    { kind: "Posters", s: r.posters },
                  ] as const
                ).map(({ kind, s }) => (
                  <div
                    key={kind}
                    className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#1a1a1a] px-3 py-2"
                  >
                    <span className="text-[12px] text-[#a1a1aa]">{kind}</span>
                    <span className="font-mono text-[12px] text-white">
                      {s.uploads} up · {s.revisions} back · {s.published} pub
                      {s.uploads > 0 && ` · ${s.revisionRate}%`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <div
                  className={cn(
                    "h-full rounded-full",
                    r.revisionRate >= 50
                      ? "bg-red-400"
                      : r.revisionRate >= 25
                        ? "bg-amber-400"
                        : "bg-emerald-500",
                  )}
                  style={{ width: `${Math.min(100, r.revisionRate)}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
