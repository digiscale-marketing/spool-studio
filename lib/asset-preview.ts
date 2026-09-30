import { getAssetPreviewType } from "@/lib/asset-display"
import { sanitizeFileUrl } from "@/lib/file-url"
import type { Asset, AssetRevision } from "@/types/index"

export interface AssetPreviewDescriptor {
  title: string
  assetId?: string | null
  mimeType?: string | null
  fileExtension?: string | null
  driveFileId?: string | null
  driveFileUrl?: string | null
  thumbnailUrl?: string | null
  fileSize?: number | null
  durationSeconds?: number | null
}

export interface AssetPreviewUrls {
  openUrl: string | null
  previewUrl: string | null
  viewUrl: string | null
  downloadUrl: string | null
  directMediaUrl: string | null
}

export function getAssetPreviewUrls(
  input: AssetPreviewDescriptor,
): AssetPreviewUrls {
  const previewType = getAssetPreviewType(input)

  // Private bucket: no public URL exists. The server presigns
  // drive_file_id per request and ships it as driveFileUrl - use it.
  // Never reconstruct a public URL from the R2 key here.
  const url = input.driveFileUrl ?? null

  return {
    openUrl: url,
    previewUrl: url,
    viewUrl: url,
    // Short app link (redirects to a fresh presigned URL with the asset
    // filename) instead of leaking the long signed R2 URL.
    downloadUrl: input.assetId
      ? `/api/assets/${input.assetId}/download`
      : url,
    directMediaUrl:
      previewType === "image"
        ? (sanitizeFileUrl(input.thumbnailUrl) ?? url)
        : url,
  }
}

export function toAssetPreviewDescriptor(
  item:
    | Pick<
        Asset,
        | "id"
        | "title"
        | "mimeType"
        | "fileExtension"
        | "driveFileId"
        | "driveFileUrl"
        | "thumbnailUrl"
        | "fileSize"
        | "durationSeconds"
      >
    | (Pick<
        AssetRevision,
        | "assetId"
        | "mimeType"
        | "driveFileId"
        | "driveFileUrl"
        | "fileSize"
        | "durationSeconds"
      > & {
        title: string
        fileExtension?: string | null
        thumbnailUrl?: string | null
      }),
): AssetPreviewDescriptor {
  return {
    title: item.title,
    assetId: "assetId" in item ? item.assetId : item.id,
    mimeType: item.mimeType ?? null,
    fileExtension:
      "fileExtension" in item ? (item.fileExtension ?? null) : null,
    driveFileId: item.driveFileId ?? null,
    driveFileUrl: item.driveFileUrl ?? null,
    thumbnailUrl: "thumbnailUrl" in item ? (item.thumbnailUrl ?? null) : null,
    fileSize: item.fileSize ?? null,
    durationSeconds: item.durationSeconds ?? null,
  }
}
