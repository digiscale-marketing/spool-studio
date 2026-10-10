import { getCurrentUser } from "@/lib/auth"
import { listAssetsByUploaderSince } from "@/repositories/assets-repository"
import { listAssetRejectionsSince } from "@/repositories/audit-log-repository"
import { getUsers } from "@/services/users-service"

export interface DesignerTypeStats {
  uploads: number
  revisions: number
  published: number
  revisionRate: number
}

export interface DesignerAnalyticsRow {
  userId: string
  name: string
  reels: DesignerTypeStats
  posters: DesignerTypeStats
  uploads: number
  revisions: number
  revisionRate: number
  published: number
  approved: number
  avgApprovalLagHours: number | null
}

function emptyTypeStats(): DesignerTypeStats {
  return { uploads: 0, revisions: 0, published: 0, revisionRate: 0 }
}

export async function getDesignerAnalytics(
  days = 10,
): Promise<{ days: number; rows: DesignerAnalyticsRow[] }> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  const windowDays = Math.min(90, Math.max(1, Math.floor(days)))

  const since = new Date()
  since.setDate(since.getDate() - windowDays)

  const users = await getUsers()
  const designers =
    user.role === "admin"
      ? users.filter((u) => u.role === "designer")
      : users.filter((u) => u.id === user.id)

  const rows: DesignerAnalyticsRow[] = []
  for (const d of designers) {
    const assets = await listAssetsByUploaderSince(d.id, since)
    const typeOf = new Map(assets.map((a) => [a.id, a.type]))
    // Revision requests = status events where WE sent work back
    // (asset_rejected audit rows in-window on this designer's assets).
    // Re-upload rows are not counted: re-uploading is the designer's answer,
    // not a new request.
    const rejections =
      assets.length > 0
        ? await listAssetRejectionsSince(
            assets.map((a) => a.id),
            since,
          )
        : []

    const reels = emptyTypeStats()
    const posters = emptyTypeStats()
    for (const a of assets) {
      const bucket = a.type === "reel" ? reels : posters
      bucket.uploads += 1
      if (a.status === "published") bucket.published += 1
    }
    for (const r of rejections) {
      const bucket = typeOf.get(r.assetId) === "reel" ? reels : posters
      bucket.revisions += 1
    }
    for (const b of [reels, posters]) {
      b.revisionRate =
        b.uploads > 0 ? Math.round((b.revisions / b.uploads) * 100) : 0
    }

    const approvedAssets = assets.filter(
      (a) => a.status === "approved" || a.status === "published",
    )
    const lags = approvedAssets
      .filter((a) => a.approved_at && a.uploaded_at)
      .map(
        (a) =>
          (new Date(a.approved_at as unknown as string).getTime() -
            new Date(a.uploaded_at as unknown as string).getTime()) /
          3600000,
      )
      .filter((h) => Number.isFinite(h) && h >= 0)

    const uploads = reels.uploads + posters.uploads
    const revisions = reels.revisions + posters.revisions
    rows.push({
      userId: d.id,
      name: d.name,
      reels,
      posters,
      uploads,
      revisions,
      revisionRate:
        uploads > 0 ? Math.round((revisions / uploads) * 100) : 0,
      published: reels.published + posters.published,
      approved: approvedAssets.length,
      avgApprovalLagHours:
        lags.length > 0
          ? Math.round((lags.reduce((s, h) => s + h, 0) / lags.length) * 10) / 10
          : null,
    })
  }

  rows.sort((a, b) => b.uploads - a.uploads)
  return { days: windowDays, rows }
}
