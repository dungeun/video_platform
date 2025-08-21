'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Save, Settings, Monitor, Mic, Camera, Users, Zap } from 'lucide-react'

interface StreamSettingsProps {
  streamKey?: string
  settings?: any
  onSave?: (settings: StreamSettingsData) => void
  onUpdate?: (settings: any) => void
  isLive?: boolean
}

export interface StreamSettingsData {
  title: string
  description: string
  category: string
  tags: string[]
  thumbnail?: string
  isRecordingEnabled: boolean
  isChatEnabled: boolean
  isSuperChatEnabled: boolean
  isSubscriberOnly: boolean
  chatDelay: number
  maxViewers: number
  language: string
  visibility: 'public' | 'unlisted' | 'private'
  ageRestriction: boolean
  monetization: boolean
}

const categories = [
  'Gaming', 'Music', 'Art', 'Technology', 'Education', 'Entertainment', 
  'Sports', 'Cooking', 'Travel', 'Lifestyle', 'News', 'Science', 'Other'
]

const languages = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' }
]

export default function StreamSettings({ streamKey, settings: initialSettings, onSave, onUpdate, isLive }: StreamSettingsProps) {
  const [settings, setSettings] = useState<StreamSettingsData>({
    title: '',
    description: '',
    category: '',
    tags: [],
    isRecordingEnabled: true,
    isChatEnabled: true,
    isSuperChatEnabled: true,
    isSubscriberOnly: false,
    chatDelay: 0,
    maxViewers: 1000,
    language: 'ko',
    visibility: 'public',
    ageRestriction: false,
    monetization: false
  })
  
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 초기 설정 적용
  useEffect(() => {
    if (initialSettings) {
      setSettings(prev => ({ ...prev, ...initialSettings }))
    } else if (streamKey) {
      loadStreamSettings()
    }
  }, [streamKey, initialSettings])

  const loadStreamSettings = async () => {
    if (!streamKey) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/streaming/streams/${streamKey}/settings`)
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('설정을 불러올 수 없습니다:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (streamKey) {
        const response = await fetch(`/api/streaming/streams/${streamKey}/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        })
        
        if (response.ok) {
          onSave?.(settings)
          onUpdate?.(settings)
        }
      } else {
        onSave?.(settings)
        onUpdate?.(settings)
      }
    } catch (error) {
      console.error('설정 저장에 실패했습니다:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTagAdd = () => {
    if (tagInput.trim() && settings.tags.length < 10) {
      setSettings(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleTagRemove = (index: number) => {
    setSettings(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTagAdd()
    }
  }

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            스트림 기본 정보
          </CardTitle>
          <CardDescription>
            시청자에게 표시되는 스트림의 기본 정보를 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="스트림 제목을 입력하세요"
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              maxLength={100}
            />
            <div className="text-sm text-muted-foreground text-right">
              {settings.title.length}/100
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="스트림에 대한 설명을 입력하세요"
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              maxLength={500}
              rows={3}
            />
            <div className="text-sm text-muted-foreground text-right">
              {settings.description.length}/500
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select value={settings.category} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">언어</Label>
              <Select value={settings.language} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, language: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">태그 (최대 10개)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="태그 입력 후 Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={settings.tags.length >= 10}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTagAdd}
                disabled={!tagInput.trim() || settings.tags.length >= 10}
              >
                추가
              </Button>
            </div>
            {settings.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleTagRemove(index)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 채팅 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            채팅 설정
          </CardTitle>
          <CardDescription>
            실시간 채팅과 관련된 설정을 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="chat-enabled">채팅 사용</Label>
              <p className="text-sm text-muted-foreground">시청자가 채팅을 사용할 수 있습니다</p>
            </div>
            <Switch
              id="chat-enabled"
              checked={settings.isChatEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, isChatEnabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="superchat-enabled">슈퍼채팅 사용</Label>
              <p className="text-sm text-muted-foreground">유료 채팅 메시지를 받을 수 있습니다</p>
            </div>
            <Switch
              id="superchat-enabled"
              checked={settings.isSuperChatEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, isSuperChatEnabled: checked }))
              }
              disabled={!settings.isChatEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="subscriber-only">구독자 전용 채팅</Label>
              <p className="text-sm text-muted-foreground">구독자만 채팅할 수 있습니다</p>
            </div>
            <Switch
              id="subscriber-only"
              checked={settings.isSubscriberOnly}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, isSubscriberOnly: checked }))
              }
              disabled={!settings.isChatEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chat-delay">채팅 지연 시간 (초)</Label>
            <Select 
              value={settings.chatDelay.toString()} 
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, chatDelay: parseInt(value) }))
              }
              disabled={!settings.isChatEnabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">즉시</SelectItem>
                <SelectItem value="2">2초</SelectItem>
                <SelectItem value="5">5초</SelectItem>
                <SelectItem value="10">10초</SelectItem>
                <SelectItem value="30">30초</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 스트림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            스트림 설정
          </CardTitle>
          <CardDescription>
            방송 품질과 관련된 설정을 조정하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="recording-enabled">녹화 저장</Label>
              <p className="text-sm text-muted-foreground">방송을 자동으로 녹화하여 저장합니다</p>
            </div>
            <Switch
              id="recording-enabled"
              checked={settings.isRecordingEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, isRecordingEnabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-viewers">최대 동접자 수</Label>
            <Select 
              value={settings.maxViewers.toString()} 
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, maxViewers: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100명</SelectItem>
                <SelectItem value="500">500명</SelectItem>
                <SelectItem value="1000">1,000명</SelectItem>
                <SelectItem value="5000">5,000명</SelectItem>
                <SelectItem value="10000">10,000명</SelectItem>
                <SelectItem value="50000">50,000명</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">공개 설정</Label>
            <Select 
              value={settings.visibility} 
              onValueChange={(value: 'public' | 'unlisted' | 'private') => 
                setSettings(prev => ({ ...prev, visibility: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">공개 - 누구나 시청 가능</SelectItem>
                <SelectItem value="unlisted">비공개 링크 - 링크를 아는 사람만</SelectItem>
                <SelectItem value="private">비공개 - 본인만</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="age-restriction">연령 제한</Label>
              <p className="text-sm text-muted-foreground">18세 이상만 시청 가능</p>
            </div>
            <Switch
              id="age-restriction"
              checked={settings.ageRestriction}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, ageRestriction: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="monetization">수익 창출</Label>
              <p className="text-sm text-muted-foreground">광고 및 후원을 통한 수익 창출</p>
            </div>
            <Switch
              id="monetization"
              checked={settings.monetization}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, monetization: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading || isSaving || !settings.title.trim() || isLive}
          className="min-w-[100px]"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </div>
    </div>
  )
}