'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Server, 
  Globe, 
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useStreamKey } from '@/hooks/useStreamKey'

interface RTMPKeyManagerProps {
  userId?: string
  onStreamKeyUpdate?: (streamKey: string) => void
}

export default function RTMPKeyManager({ userId, onStreamKeyUpdate }: RTMPKeyManagerProps) {
  const {
    streamKey,
    streamUrl,
    isLoading,
    error,
    generateNewKey,
    validateKey,
    isConnected
  } = useStreamKey(userId)

  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState<'url' | 'key' | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const serverUrl = process.env.NEXT_PUBLIC_STREAMING_SERVER_URL || 'rtmp://localhost:1935'
  const maskedKey = streamKey ? `${streamKey.slice(0, 8)}...${streamKey.slice(-4)}` : ''

  // 스트림 키 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (streamKey) {
      onStreamKeyUpdate?.(streamKey)
    }
  }, [streamKey, onStreamKeyUpdate])

  const handleCopy = async (type: 'url' | 'key', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('복사에 실패했습니다:', error)
    }
  }

  const handleGenerateNewKey = async () => {
    setIsGenerating(true)
    try {
      await generateNewKey()
    } finally {
      setIsGenerating(false)
    }
  }

  const getConnectionStatus = () => {
    if (isConnected === null) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: '상태 확인 중...',
        color: 'text-yellow-500'
      }
    } else if (isConnected) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        text: '연결됨',
        color: 'text-green-500'
      }
    } else {
      return {
        icon: <XCircle className="h-4 w-4" />,
        text: '연결 안됨',
        color: 'text-red-500'
      }
    }
  }

  const connectionStatus = getConnectionStatus()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            RTMP 스트림 키
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">스트림 키를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            RTMP 스트림 키
          </CardTitle>
          <CardDescription>
            OBS Studio나 기타 방송 소프트웨어에서 사용할 RTMP 설정 정보입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 연결 상태 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>스트림 상태</Label>
              <div className={`flex items-center gap-1 ${connectionStatus.color}`}>
                {connectionStatus.icon}
                <span className="text-sm font-medium">{connectionStatus.text}</span>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? '라이브' : '오프라인'}
            </Badge>
          </div>

          {/* 서버 URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              서버 URL
            </Label>
            <div className="flex gap-2">
              <Input
                value={serverUrl}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy('url', serverUrl)}
                className="px-3"
              >
                {copied === 'url' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              OBS의 '서비스' → '사용자 지정' → '서버'에 입력하세요
            </p>
          </div>

          {/* 스트림 키 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              스트림 키
            </Label>
            <div className="flex gap-2">
              <Input
                value={showKey ? streamKey || '' : maskedKey}
                readOnly
                className="font-mono"
                type={showKey ? 'text' : 'password'}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="px-3"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => streamKey && handleCopy('key', streamKey)}
                className="px-3"
                disabled={!streamKey}
              >
                {copied === 'key' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              OBS의 '설정' → '스트림' → '스트림 키'에 입력하세요
            </p>
          </div>

          {/* 키 재생성 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>스트림 키 재생성</Label>
              <p className="text-sm text-muted-foreground">
                보안상의 이유로 정기적으로 키를 변경하는 것을 권장합니다
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleGenerateNewKey}
              disabled={isGenerating}
              className="min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  생성 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  새 키 생성
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 보안 알림 */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>보안 주의사항:</strong> 스트림 키는 절대 다른 사람과 공유하지 마세요. 
          이 키를 가진 사람은 누구나 당신의 계정으로 방송을 할 수 있습니다.
        </AlertDescription>
      </Alert>

      {/* OBS 설정 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            OBS Studio 설정 가이드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1단계:</strong> OBS Studio를 실행하고 '설정' → '스트림'으로 이동</p>
            <p><strong>2단계:</strong> '서비스'를 '사용자 지정'으로 선택</p>
            <p><strong>3단계:</strong> '서버'에 위의 서버 URL을 입력</p>
            <p><strong>4단계:</strong> '스트림 키'에 위의 스트림 키를 입력</p>
            <p><strong>5단계:</strong> '확인'을 클릭하고 '방송 시작' 버튼을 사용</p>
          </div>
          
          <div className="pt-3 border-t">
            <p className="text-sm font-medium mb-2">권장 설정:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 비트레이트: 2500-5000 kbps (인터넷 속도에 따라)</li>
              <li>• 해상도: 1920x1080 (Full HD)</li>
              <li>• 프레임률: 30fps 또는 60fps</li>
              <li>• 인코더: H.264</li>
              <li>• 키프레임 간격: 2초</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}