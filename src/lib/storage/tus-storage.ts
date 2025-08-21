import { PrismaClient } from '@prisma/client'
import { redis } from '@/lib/redis'

const prisma = new PrismaClient()

export interface TUSUploadInfo {
  id: string
  length: number
  offset: number
  metadata: any
  createdAt: string
  chunks?: Buffer[]
}

/**
 * TUS 업로드 정보를 영구 저장소에 저장
 * Redis를 캐시로 사용하고 PostgreSQL을 영구 저장소로 사용
 */
export class TUSStorage {
  private static instance: TUSStorage
  private cachePrefix = 'tus:upload:'
  private cacheTTL = 3600 // 1시간

  private constructor() {}

  static getInstance(): TUSStorage {
    if (!TUSStorage.instance) {
      TUSStorage.instance = new TUSStorage()
    }
    return TUSStorage.instance
  }

  /**
   * 업로드 정보 저장
   */
  async set(id: string, info: TUSUploadInfo): Promise<void> {
    // Redis 캐시에 저장
    if (redis) {
      await redis.setex(
        `${this.cachePrefix}${id}`,
        this.cacheTTL,
        JSON.stringify(info)
      )
    }

    // PostgreSQL에 저장
    await prisma.files.upsert({
      where: { id },
      update: {
        size: info.length,
        uploadOffset: info.offset,
        metadata: info.metadata,
        status: info.offset >= info.length ? 'completed' : 'uploading',
        updatedAt: new Date()
      },
      create: {
        id,
        filename: info.metadata?.filename || 'unknown',
        mimetype: info.metadata?.filetype || 'application/octet-stream',
        size: info.length,
        uploadOffset: info.offset,
        metadata: info.metadata,
        status: 'uploading',
        userId: info.metadata?.userId || null
      }
    })
  }

  /**
   * 업로드 정보 조회
   */
  async get(id: string): Promise<TUSUploadInfo | null> {
    // Redis 캐시에서 먼저 조회
    if (redis) {
      const cached = await redis.get(`${this.cachePrefix}${id}`)
      if (cached) {
        return JSON.parse(cached)
      }
    }

    // PostgreSQL에서 조회
    const file = await prisma.files.findUnique({
      where: { id }
    })

    if (!file) {
      return null
    }

    const info: TUSUploadInfo = {
      id: file.id,
      length: file.size,
      offset: file.uploadOffset || 0,
      metadata: file.metadata as any,
      createdAt: file.createdAt.toISOString()
    }

    // Redis 캐시 업데이트
    if (redis) {
      await redis.setex(
        `${this.cachePrefix}${id}`,
        this.cacheTTL,
        JSON.stringify(info)
      )
    }

    return info
  }

  /**
   * 업로드 정보 삭제
   */
  async delete(id: string): Promise<void> {
    // Redis 캐시에서 삭제
    if (redis) {
      await redis.del(`${this.cachePrefix}${id}`)
    }

    // PostgreSQL에서 삭제
    await prisma.files.delete({
      where: { id }
    }).catch(() => {
      // 파일이 없어도 에러 무시
    })
  }

  /**
   * 청크 데이터 저장 (임시로 Redis에 저장)
   */
  async appendChunk(id: string, chunk: Buffer): Promise<void> {
    if (redis) {
      const chunkKey = `${this.cachePrefix}chunk:${id}`
      await redis.rpush(chunkKey, chunk.toString('base64'))
      await redis.expire(chunkKey, this.cacheTTL)
    }
  }

  /**
   * 청크 데이터 조회 및 병합
   */
  async getChunks(id: string): Promise<Buffer | null> {
    if (!redis) {
      return null
    }

    const chunkKey = `${this.cachePrefix}chunk:${id}`
    const chunks = await redis.lrange(chunkKey, 0, -1)
    
    if (!chunks || chunks.length === 0) {
      return null
    }

    // Base64 청크들을 Buffer로 변환하고 병합
    const buffers = chunks.map(chunk => Buffer.from(chunk, 'base64'))
    return Buffer.concat(buffers)
  }

  /**
   * 청크 데이터 삭제
   */
  async deleteChunks(id: string): Promise<void> {
    if (redis) {
      const chunkKey = `${this.cachePrefix}chunk:${id}`
      await redis.del(chunkKey)
    }
  }
}

export const tusStorage = TUSStorage.getInstance()