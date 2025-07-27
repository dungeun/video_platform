# 통합 상호작용 시스템 설계

## 1. 핵심 개념

모든 상호작용(좋아요, 댓글, 저장, 팔로우 등)을 통합된 시스템으로 관리하여 코드 재사용성과 확장성을 높입니다.

## 2. 데이터베이스 설계

### 2.1 통합 상호작용 테이블

```prisma
// 상호작용 타입 enum
enum InteractionType {
  LIKE        // 좋아요
  SAVE        // 저장/즐겨찾기
  FOLLOW      // 팔로우
  VIEW        // 조회
  SHARE       // 공유
  REPORT      // 신고
}

// 대상 엔티티 타입
enum EntityType {
  CAMPAIGN
  POST
  USER
  CONTENT
  COMMENT
}

// 통합 상호작용 모델
model Interaction {
  id            String           @id @default(cuid())
  userId        String           // 상호작용을 한 사용자
  entityType    EntityType       // 대상 엔티티 타입
  entityId      String           // 대상 엔티티 ID
  type          InteractionType  // 상호작용 타입
  metadata      Json?            // 추가 데이터 (예: 공유 플랫폼, 신고 사유 등)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  
  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, entityType, entityId, type]) // 중복 방지
  @@index([entityType, entityId]) // 엔티티별 조회 최적화
  @@index([userId, type]) // 사용자별 상호작용 조회 최적화
  @@map("interactions")
}

// 댓글은 구조가 복잡하므로 별도 테이블 유지
model Comment {
  id            String      @id @default(cuid())
  userId        String
  entityType    EntityType  // CAMPAIGN, POST 등
  entityId      String
  content       String
  parentId      String?     // 대댓글용
  status        String      @default("ACTIVE")
  editedAt      DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent        Comment?    @relation("CommentReplies", fields: [parentId], references: [id])
  replies       Comment[]   @relation("CommentReplies")
  
  @@index([entityType, entityId])
  @@index([userId])
  @@map("comments")
}

// 상호작용 통계 (캐시 테이블)
model InteractionStats {
  id            String      @id @default(cuid())
  entityType    EntityType
  entityId      String
  likeCount     Int         @default(0)
  saveCount     Int         @default(0)
  viewCount     Int         @default(0)
  shareCount    Int         @default(0)
  commentCount  Int         @default(0)
  lastUpdated   DateTime    @default(now())
  
  @@unique([entityType, entityId])
  @@index([entityType, entityId])
  @@map("interaction_stats")
}
```

## 3. 서비스 계층 설계

### 3.1 통합 상호작용 서비스

```typescript
// src/services/interaction.service.ts
export class InteractionService {
  // 상호작용 토글 (좋아요, 저장 등)
  async toggleInteraction(
    userId: string,
    entityType: EntityType,
    entityId: string,
    interactionType: InteractionType,
    metadata?: any
  ): Promise<{ active: boolean; count: number }> {
    // 트랜잭션으로 처리
    return await prisma.$transaction(async (tx) => {
      // 기존 상호작용 확인
      const existing = await tx.interaction.findUnique({
        where: {
          userId_entityType_entityId_type: {
            userId,
            entityType,
            entityId,
            type: interactionType
          }
        }
      })

      let active: boolean
      
      if (existing) {
        // 상호작용 제거
        await tx.interaction.delete({ where: { id: existing.id } })
        active = false
      } else {
        // 상호작용 추가
        await tx.interaction.create({
          data: {
            userId,
            entityType,
            entityId,
            type: interactionType,
            metadata
          }
        })
        active = true
      }

      // 통계 업데이트
      await this.updateStats(tx, entityType, entityId, interactionType, active ? 1 : -1)
      
      // 현재 카운트 반환
      const stats = await tx.interactionStats.findUnique({
        where: { entityType_entityId: { entityType, entityId } }
      })
      
      const countField = `${interactionType.toLowerCase()}Count`
      const count = stats?.[countField] || 0
      
      return { active, count }
    })
  }

  // 상호작용 상태 확인
  async checkInteractionStatus(
    userId: string,
    entityType: EntityType,
    entityId: string,
    interactionTypes: InteractionType[]
  ): Promise<Record<InteractionType, boolean>> {
    const interactions = await prisma.interaction.findMany({
      where: {
        userId,
        entityType,
        entityId,
        type: { in: interactionTypes }
      }
    })

    return interactionTypes.reduce((acc, type) => {
      acc[type] = interactions.some(i => i.type === type)
      return acc
    }, {} as Record<InteractionType, boolean>)
  }

  // 통계 조회
  async getStats(
    entityType: EntityType,
    entityId: string
  ): Promise<InteractionStats | null> {
    return await prisma.interactionStats.findUnique({
      where: { entityType_entityId: { entityType, entityId } }
    })
  }

  // 사용자의 상호작용 목록 조회
  async getUserInteractions(
    userId: string,
    type: InteractionType,
    entityType?: EntityType,
    page: number = 1,
    limit: number = 20
  ) {
    const where = {
      userId,
      type,
      ...(entityType && { entityType })
    }

    const [items, total] = await Promise.all([
      prisma.interaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.interaction.count({ where })
    ])

    return { items, total, page, limit }
  }

  // 통계 업데이트 (내부 메서드)
  private async updateStats(
    tx: any,
    entityType: EntityType,
    entityId: string,
    interactionType: InteractionType,
    delta: number
  ) {
    const countField = `${interactionType.toLowerCase()}Count`
    
    await tx.interactionStats.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      create: {
        entityType,
        entityId,
        [countField]: Math.max(0, delta)
      },
      update: {
        [countField]: { increment: delta },
        lastUpdated: new Date()
      }
    })
  }
}
```

### 3.2 댓글 서비스

```typescript
// src/services/comment.service.ts
export class CommentService {
  // 댓글 작성
  async createComment(
    userId: string,
    entityType: EntityType,
    entityId: string,
    content: string,
    parentId?: string
  ): Promise<Comment> {
    return await prisma.$transaction(async (tx) => {
      // 댓글 생성
      const comment = await tx.comment.create({
        data: {
          userId,
          entityType,
          entityId,
          content,
          parentId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { profileImage: true }
              }
            }
          }
        }
      })

      // 댓글 수 증가
      await tx.interactionStats.upsert({
        where: { entityType_entityId: { entityType, entityId } },
        create: {
          entityType,
          entityId,
          commentCount: 1
        },
        update: {
          commentCount: { increment: 1 },
          lastUpdated: new Date()
        }
      })

      // 알림 생성 (엔티티 소유자에게)
      await this.createCommentNotification(tx, comment, entityType, entityId)

      return comment
    })
  }

  // 댓글 목록 조회
  async getComments(
    entityType: EntityType,
    entityId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const where = {
      entityType,
      entityId,
      parentId: null, // 최상위 댓글만
      status: 'ACTIVE'
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { profileImage: true }
              }
            }
          },
          replies: {
            where: { status: 'ACTIVE' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profile: {
                    select: { profileImage: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      prisma.comment.count({ where })
    ])

    return { comments, total, page, limit }
  }

  // 댓글 수정
  async updateComment(
    commentId: string,
    userId: string,
    content: string
  ): Promise<Comment> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment || comment.userId !== userId) {
      throw new Error('권한이 없습니다.')
    }

    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        editedAt: new Date()
      }
    })
  }

  // 댓글 삭제 (소프트 삭제)
  async deleteComment(
    commentId: string,
    userId: string
  ): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment || comment.userId !== userId) {
      throw new Error('권한이 없습니다.')
    }

    await prisma.$transaction(async (tx) => {
      // 댓글 상태 변경
      await tx.comment.update({
        where: { id: commentId },
        data: { status: 'DELETED' }
      })

      // 댓글 수 감소
      await tx.interactionStats.update({
        where: {
          entityType_entityId: {
            entityType: comment.entityType,
            entityId: comment.entityId
          }
        },
        data: {
          commentCount: { decrement: 1 },
          lastUpdated: new Date()
        }
      })
    })
  }
}
```

## 4. API 엔드포인트 설계

### 4.1 통합 상호작용 API

```typescript
// src/app/api/interactions/route.ts
export async function POST(req: Request) {
  const { entityType, entityId, type, metadata } = await req.json()
  const userId = await getCurrentUserId(req)
  
  const interactionService = new InteractionService()
  const result = await interactionService.toggleInteraction(
    userId,
    entityType,
    entityId,
    type,
    metadata
  )
  
  return NextResponse.json(result)
}

// src/app/api/interactions/status/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entityType') as EntityType
  const entityId = searchParams.get('entityId')
  const types = searchParams.getAll('types') as InteractionType[]
  const userId = await getCurrentUserId(req)
  
  const interactionService = new InteractionService()
  const status = await interactionService.checkInteractionStatus(
    userId,
    entityType,
    entityId,
    types
  )
  
  return NextResponse.json(status)
}

// src/app/api/interactions/stats/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entityType') as EntityType
  const entityId = searchParams.get('entityId')
  
  const interactionService = new InteractionService()
  const stats = await interactionService.getStats(entityType, entityId)
  
  return NextResponse.json(stats || {
    likeCount: 0,
    saveCount: 0,
    viewCount: 0,
    shareCount: 0,
    commentCount: 0
  })
}
```

### 4.2 댓글 API

```typescript
// src/app/api/comments/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entityType') as EntityType
  const entityId = searchParams.get('entityId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  const commentService = new CommentService()
  const result = await commentService.getComments(
    entityType,
    entityId,
    page,
    limit
  )
  
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const { entityType, entityId, content, parentId } = await req.json()
  const userId = await getCurrentUserId(req)
  
  const commentService = new CommentService()
  const comment = await commentService.createComment(
    userId,
    entityType,
    entityId,
    content,
    parentId
  )
  
  return NextResponse.json(comment)
}
```

## 5. React Hook 설계

### 5.1 useInteractions Hook

```typescript
// src/hooks/useInteractions.ts
export function useInteractions(
  entityType: EntityType,
  entityId: string
) {
  const { user } = useAuth()
  const [stats, setStats] = useState<InteractionStats | null>(null)
  const [status, setStatus] = useState<Record<InteractionType, boolean>>({})
  const [loading, setLoading] = useState(false)

  // 초기 데이터 로드
  useEffect(() => {
    if (entityId) {
      loadData()
    }
  }, [entityId, user])

  const loadData = async () => {
    try {
      // 통계 조회
      const statsRes = await fetch(
        `/api/interactions/stats?entityType=${entityType}&entityId=${entityId}`
      )
      const statsData = await statsRes.json()
      setStats(statsData)

      // 로그인 사용자의 상호작용 상태 조회
      if (user) {
        const statusRes = await fetch(
          `/api/interactions/status?entityType=${entityType}&entityId=${entityId}` +
          `&types=LIKE&types=SAVE`
        )
        const statusData = await statusRes.json()
        setStatus(statusData)
      }
    } catch (error) {
      console.error('Failed to load interaction data:', error)
    }
  }

  // 상호작용 토글
  const toggleInteraction = async (type: InteractionType) => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          entityType,
          entityId,
          type
        })
      })

      if (!res.ok) throw new Error('Failed to toggle interaction')

      const { active, count } = await res.json()
      
      // 상태 업데이트
      setStatus(prev => ({ ...prev, [type]: active }))
      
      // 통계 업데이트
      const countField = `${type.toLowerCase()}Count`
      setStats(prev => prev ? {
        ...prev,
        [countField]: count
      } : null)

      // 토스트 메시지
      const messages = {
        LIKE: active ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.',
        SAVE: active ? '저장했습니다.' : '저장을 취소했습니다.',
        FOLLOW: active ? '팔로우했습니다.' : '팔로우를 취소했습니다.'
      }
      toast.success(messages[type])
    } catch (error) {
      toast.error('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    status,
    loading,
    toggleInteraction,
    isLiked: status.LIKE || false,
    isSaved: status.SAVE || false,
    likeCount: stats?.likeCount || 0,
    saveCount: stats?.saveCount || 0,
    viewCount: stats?.viewCount || 0,
    commentCount: stats?.commentCount || 0
  }
}
```

### 5.2 useComments Hook

```typescript
// src/hooks/useComments.ts
export function useComments(
  entityType: EntityType,
  entityId: string
) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (entityId) {
      loadComments()
    }
  }, [entityId, page])

  const loadComments = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/comments?entityType=${entityType}&entityId=${entityId}` +
        `&page=${page}&limit=20`
      )
      const data = await res.json()
      
      if (page === 1) {
        setComments(data.comments)
      } else {
        setComments(prev => [...prev, ...data.comments])
      }
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const addComment = async (content: string, parentId?: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          entityType,
          entityId,
          content,
          parentId
        })
      })

      if (!res.ok) throw new Error('Failed to add comment')

      const newComment = await res.json()
      
      if (parentId) {
        // 대댓글인 경우
        setComments(prev => prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment]
            }
          }
          return comment
        }))
      } else {
        // 새 댓글인 경우
        setComments(prev => [newComment, ...prev])
        setTotal(prev => prev + 1)
      }

      toast.success('댓글이 작성되었습니다.')
    } catch (error) {
      toast.error('댓글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateComment = async (commentId: string, content: string) => {
    // 구현...
  }

  const deleteComment = async (commentId: string) => {
    // 구현...
  }

  return {
    comments,
    total,
    loading,
    submitting,
    page,
    setPage,
    addComment,
    updateComment,
    deleteComment,
    hasMore: comments.length < total
  }
}
```

## 6. 컴포넌트 예시

### 6.1 InteractionBar 컴포넌트

```typescript
// src/components/common/InteractionBar.tsx
interface InteractionBarProps {
  entityType: EntityType
  entityId: string
  showViews?: boolean
  showSave?: boolean
  showShare?: boolean
  className?: string
}

export function InteractionBar({
  entityType,
  entityId,
  showViews = true,
  showSave = true,
  showShare = true,
  className
}: InteractionBarProps) {
  const {
    isLiked,
    isSaved,
    likeCount,
    viewCount,
    commentCount,
    toggleInteraction
  } = useInteractions(entityType, entityId)

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* 좋아요 */}
      <button
        onClick={() => toggleInteraction('LIKE')}
        className="flex items-center gap-2 hover:text-red-500 transition-colors"
      >
        <Heart
          className={cn(
            "w-5 h-5",
            isLiked && "fill-red-500 text-red-500"
          )}
        />
        <span>{likeCount}</span>
      </button>

      {/* 댓글 */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <span>{commentCount}</span>
      </div>

      {/* 조회수 */}
      {showViews && (
        <div className="flex items-center gap-2 text-gray-500">
          <Eye className="w-5 h-5" />
          <span>{viewCount}</span>
        </div>
      )}

      {/* 저장 */}
      {showSave && (
        <button
          onClick={() => toggleInteraction('SAVE')}
          className="flex items-center gap-2 hover:text-blue-500 transition-colors"
        >
          <Bookmark
            className={cn(
              "w-5 h-5",
              isSaved && "fill-blue-500 text-blue-500"
            )}
          />
        </button>
      )}

      {/* 공유 */}
      {showShare && (
        <button
          onClick={() => handleShare()}
          className="flex items-center gap-2 hover:text-green-500 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
```

### 6.2 CommentSection 컴포넌트

```typescript
// src/components/common/CommentSection.tsx
interface CommentSectionProps {
  entityType: EntityType
  entityId: string
}

export function CommentSection({
  entityType,
  entityId
}: CommentSectionProps) {
  const { user } = useAuth()
  const {
    comments,
    total,
    loading,
    submitting,
    addComment,
    hasMore,
    setPage
  } = useComments(entityType, entityId)
  
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    await addComment(newComment, replyTo || undefined)
    setNewComment('')
    setReplyTo(null)
  }

  return (
    <div className="space-y-6">
      {/* 댓글 작성 폼 */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              replyTo
                ? "답글을 작성하세요..."
                : "댓글을 작성하세요..."
            }
            className="min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            {replyTo && (
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                답글 취소
              </button>
            )}
            <Button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="ml-auto"
            >
              {submitting ? '작성 중...' : '댓글 작성'}
            </Button>
          </div>
        </form>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="text-center py-8">
            <Spinner />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            첫 번째 댓글을 작성해보세요!
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={() => setReplyTo(comment.id)}
              />
            ))}
            
            {hasMore && (
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="w-full py-2 text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                {loading ? '로딩 중...' : '더 보기'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

## 7. 마이그레이션 전략

### 7.1 단계별 마이그레이션

1. **Phase 1**: 새로운 테이블 및 서비스 생성
   - 기존 시스템과 병행 운영
   - 새로운 엔티티부터 통합 시스템 적용

2. **Phase 2**: 기존 데이터 마이그레이션
   - CampaignLike → Interaction (type: LIKE)
   - PostLike → Interaction (type: LIKE)
   - SavedCampaign → Interaction (type: SAVE)
   - 기존 댓글 → 새 Comment 테이블

3. **Phase 3**: API 엔드포인트 전환
   - 기존 API를 새 서비스로 리다이렉트
   - 클라이언트 코드 점진적 업데이트

4. **Phase 4**: 기존 테이블 제거
   - 모든 참조가 제거된 후 기존 테이블 삭제

### 7.2 마이그레이션 스크립트 예시

```sql
-- 좋아요 데이터 마이그레이션
INSERT INTO interactions (userId, entityType, entityId, type, createdAt)
SELECT userId, 'CAMPAIGN', campaignId, 'LIKE', createdAt
FROM campaign_likes;

INSERT INTO interactions (userId, entityType, entityId, type, createdAt)
SELECT userId, 'POST', postId, 'LIKE', createdAt
FROM post_likes;

-- 저장 데이터 마이그레이션
INSERT INTO interactions (userId, entityType, entityId, type, createdAt)
SELECT userId, 'CAMPAIGN', campaignId, 'SAVE', createdAt
FROM saved_campaigns;

-- 통계 초기화
INSERT INTO interaction_stats (entityType, entityId, likeCount, saveCount, commentCount)
SELECT 'CAMPAIGN', id,
  (SELECT COUNT(*) FROM campaign_likes WHERE campaignId = campaigns.id),
  (SELECT COUNT(*) FROM saved_campaigns WHERE campaignId = campaigns.id),
  0
FROM campaigns;
```

## 8. 장점

1. **코드 재사용성**: 모든 엔티티에 동일한 상호작용 로직 적용 가능
2. **확장성**: 새로운 엔티티나 상호작용 타입 추가가 쉬움
3. **일관성**: 모든 상호작용이 동일한 패턴으로 작동
4. **성능**: 통계 캐싱으로 빠른 조회 가능
5. **유지보수성**: 중앙화된 로직으로 버그 수정 및 기능 개선 용이

## 9. 고려사항

1. **트랜잭션 관리**: 상호작용과 통계 업데이트는 항상 트랜잭션으로 처리
2. **캐시 무효화**: 통계 업데이트 시 적절한 캐시 무효화 필요
3. **권한 관리**: 엔티티별 권한 체크 로직 구현 필요
4. **성능 모니터링**: 대량 데이터 처리 시 인덱스 최적화 필요
5. **백워드 호환성**: 마이그레이션 기간 동안 기존 API 지원