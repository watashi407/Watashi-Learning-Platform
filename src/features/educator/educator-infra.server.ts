import { randomUUID } from 'node:crypto'
import { createServiceSupabaseClient } from '../../lib/supabase/server'
import type { AuthSession } from '../../shared/contracts/auth'
import type { MediaAssetType, MediaItemRecord, MediaSourceModule } from '../../shared/contracts/educator'
import { hasSupabaseConfig } from '../../server/env'

type RegisterMediaItemInput = {
  ownerUserId: string
  sourceModule: MediaSourceModule
  assetType: MediaAssetType
  fileName: string
  fileType: string | null
  sizeBytes: number
  storageBucket: string | null
  storagePath: string | null
  variant?: string
  linkedEntityType?: string | null
  linkedEntityId?: string | null
  metadata?: Record<string, unknown>
}

type AppendActivityLogInput = {
  userId: string
  module: string
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}

type MediaLibraryRow = {
  id: string
  owner_user_id: string
  source_module: MediaSourceModule
  asset_type: MediaAssetType
  file_name: string
  file_type: string | null
  size_bytes: number
  storage_bucket: string | null
  storage_path: string | null
  variant: string
  linked_entity_type: string | null
  linked_entity_id: string | null
  metadata_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

type ActivityLogRow = {
  id: string
  user_id: string
  module: string
  action: string
  entity_type: string
  entity_id: string | null
  metadata_json: Record<string, unknown>
  created_at: string
}

export function mapMediaRow(row: MediaLibraryRow): MediaItemRecord {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    sourceModule: row.source_module,
    assetType: row.asset_type,
    fileName: row.file_name,
    fileType: row.file_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    variant: row.variant,
    linkedEntityType: row.linked_entity_type,
    linkedEntityId: row.linked_entity_id,
    metadata: row.metadata_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapActivityRow(row: ActivityLogRow) {
  return {
    id: row.id,
    userId: row.user_id,
    module: row.module,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata_json ?? {},
    createdAt: row.created_at,
  }
}

export async function registerMediaItem(input: RegisterMediaItemInput): Promise<MediaItemRecord | null> {
  if (!hasSupabaseConfig()) {
    return {
      id: randomUUID(),
      ownerUserId: input.ownerUserId,
      sourceModule: input.sourceModule,
      assetType: input.assetType,
      fileName: input.fileName,
      fileType: input.fileType,
      sizeBytes: input.sizeBytes,
      storageBucket: input.storageBucket,
      storagePath: input.storagePath,
      variant: input.variant ?? 'original',
      linkedEntityType: input.linkedEntityType ?? null,
      linkedEntityId: input.linkedEntityId ?? null,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('media_library')
    .upsert({
      owner_user_id: input.ownerUserId,
      source_module: input.sourceModule,
      asset_type: input.assetType,
      file_name: input.fileName,
      file_type: input.fileType,
      size_bytes: input.sizeBytes,
      storage_bucket: input.storageBucket,
      storage_path: input.storagePath,
      variant: input.variant ?? 'original',
      linked_entity_type: input.linkedEntityType ?? null,
      linked_entity_id: input.linkedEntityId ?? null,
      metadata_json: input.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'owner_user_id,storage_bucket,storage_path,variant',
    })
    .select('id, owner_user_id, source_module, asset_type, file_name, file_type, size_bytes, storage_bucket, storage_path, variant, linked_entity_type, linked_entity_id, metadata_json, created_at, updated_at')
    .single()

  if (error || !data) {
    return null
  }

  return mapMediaRow(data as MediaLibraryRow)
}

export async function appendActivityLog(input: AppendActivityLogInput): Promise<void> {
  if (!hasSupabaseConfig()) {
    return
  }

  const supabase = createServiceSupabaseClient()
  await supabase.from('activity_logs').insert({
    user_id: input.userId,
    module: input.module,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata_json: input.metadata ?? {},
  })
}

export async function requireEducatorOrAdmin(user: AuthSession) {
  if (user.role !== 'educator' && user.role !== 'admin') {
    throw new Error('forbidden')
  }
}
