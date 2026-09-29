import { NextResponse } from "next/server"
import { jsonError } from "@/lib/api-error"
import { requireUser } from "@/lib/auth"
import { logProductionRuntimeError } from "@/lib/runtime-diagnostics"
import { getLatestCommentAtByAsset } from "@/repositories/asset-comments-repository"

export async function GET() {
  try {
    await requireUser()
    const rows = await getLatestCommentAtByAsset()
    const data: Record<string, string> = {}
    for (const row of rows) {
      data[row.assetId] = new Date(row.latestAt).toISOString()
    }
    return NextResponse.json({ data })
  } catch (error) {
    logProductionRuntimeError("api-assets-comment-activity-get", error)
    return jsonError(error)
  }
}
