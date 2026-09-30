import { NextResponse } from "next/server"
import { getPresignedDownloadUrl } from "@/integrations/r2/r2-service"
import { ApiError, jsonError } from "@/lib/api-error"
import { requireUser } from "@/lib/auth"
import { logProductionRuntimeError } from "@/lib/runtime-diagnostics"
import { getAssetById } from "@/repositories/assets-repository"

interface RouteContext {
  params: Promise<{ id: string }>
}

function downloadFileName(
  title: string,
  ext: string | null,
  mime: string | null,
): string {
  const safe = title.replace(/[^\w\-. ]+/g, "").trim().slice(0, 80) || "asset"
  const extension =
    ext?.replace(/^\./, "") ||
    (mime === "video/mp4"
      ? "mp4"
      : mime === "application/pdf"
        ? "pdf"
        : mime?.startsWith("image/")
          ? mime.split("/")[1]
          : "") ||
    "bin"
  return `${safe}.${extension}`
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireUser()

    const params = await context.params
    const assetId = params?.id
    if (!assetId) {
      throw ApiError.badRequest("Asset id is required")
    }

    const asset = await getAssetById(assetId)
    if (!asset?.drive_file_id) {
      throw ApiError.notFound("No file attached to this asset")
    }

    const url = await getPresignedDownloadUrl(
      asset.drive_file_id,
      3600,
      downloadFileName(asset.title, asset.file_extension, asset.mime_type),
    )
    return NextResponse.redirect(url)
  } catch (error) {
    logProductionRuntimeError("api-assets-download", error)
    return jsonError(error)
  }
}
