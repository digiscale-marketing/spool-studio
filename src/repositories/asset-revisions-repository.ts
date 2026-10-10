import { and, desc, eq, gte, inArray } from "drizzle-orm"
import { db } from "@/db"
import { assetRevisions } from "@/db/schema"

export type DbAssetRevision = typeof assetRevisions.$inferSelect

export async function listRevisionsForAssetsSince(
  assetIds: string[],
  since?: Date,
): Promise<DbAssetRevision[]> {
  if (assetIds.length === 0) return []
  const conditions = [inArray(assetRevisions.asset_id, assetIds)]
  if (since) conditions.push(gte(assetRevisions.uploaded_at, since))
  return db
    .select()
    .from(assetRevisions)
    .where(and(...conditions))
}

export async function listAssetRevisionsByAssetId(
  assetId: string,
): Promise<DbAssetRevision[]> {
  return db
    .select()
    .from(assetRevisions)
    .where(eq(assetRevisions.asset_id, assetId))
    .orderBy(desc(assetRevisions.version_number))
}

export async function getAssetRevisionById(
  id: string,
): Promise<DbAssetRevision | null> {
  const rows = await db
    .select()
    .from(assetRevisions)
    .where(eq(assetRevisions.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function insertAssetRevision(
  payload: typeof assetRevisions.$inferInsert,
): Promise<DbAssetRevision> {
  const insertValues = payload
  const rows = await db
    .insert(assetRevisions)
    .values(insertValues)
    .returning()
  return rows[0]
}

export async function deleteAssetRevisionsByAssetId(
  assetId: string,
): Promise<void> {
  await db.delete(assetRevisions).where(eq(assetRevisions.asset_id, assetId))
}
