'use client'

// 채팅 메시지 필터링 및 모더레이션을 위한 유틸리티 컴포넌트
interface FilterRule {
  id: string
  type: 'keyword' | 'regex' | 'spam'
  pattern: string
  action: 'warn' | 'mute' | 'ban' | 'delete'
  enabled: boolean
  severity: 'low' | 'medium' | 'high'
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: Date
  type: 'regular' | 'superchat' | 'system'
}

interface FilterResult {
  allowed: boolean
  action?: 'warn' | 'mute' | 'ban' | 'delete'
  reason?: string
  severity?: 'low' | 'medium' | 'high'
  filteredMessage?: string
}

// 금지된 키워드 목록 (기본값)
const DEFAULT_BANNED_KEYWORDS = [
  // 욕설 및 비방
  '시발', '씨발', '개새끼', '병신', '바보', '멍청이',
  // 스팸 관련
  '광고', '홍보', '돈벌이', '부업', '재택근무',
  // 개인정보 요청
  '전화번호', '카카오톡', '라인', '인스타그램'
]

// 스팸 감지 패턴
const SPAM_PATTERNS = [
  /(.)\1{4,}/g, // 같은 문자 5개 이상 반복
  /[!@#$%^&*]{3,}/g, // 특수문자 3개 이상 연속
  /(http[s]?:\/\/[^\s]+)/g, // URL 패턴
  /(\d{3,4}-\d{3,4}-\d{4})/g, // 전화번호 패턴
]

export class ChatFilter {
  private filterRules: FilterRule[] = []
  private userMessageCount: Map<string, number[]> = new Map()
  private bannedUsers: Set<string> = new Set()
  private mutedUsers: Map<string, number> = new Map() // userId -> unmute timestamp

  constructor(filterRules: FilterRule[] = []) {
    this.filterRules = [...filterRules]
    this.initializeDefaultRules()
  }

  // 기본 필터 규칙 초기화
  private initializeDefaultRules() {
    // 기본 키워드 필터
    const keywordFilter: FilterRule = {
      id: 'default-keywords',
      type: 'keyword',
      pattern: DEFAULT_BANNED_KEYWORDS.join('|'),
      action: 'delete',
      enabled: true,
      severity: 'medium'
    }

    // 스팸 감지 필터
    const spamFilter: FilterRule = {
      id: 'default-spam',
      type: 'spam',
      pattern: '5', // 5초에 5개 이상 메시지
      action: 'mute',
      enabled: true,
      severity: 'high'
    }

    // URL 차단 필터
    const urlFilter: FilterRule = {
      id: 'default-url',
      type: 'regex',
      pattern: 'http[s]?:\\/\\/[^\\s]+',
      action: 'delete',
      enabled: true,
      severity: 'medium'
    }

    this.filterRules.push(keywordFilter, spamFilter, urlFilter)
  }

  // 메시지 필터링
  filterMessage(message: ChatMessage): FilterResult {
    // 차단된 사용자 확인
    if (this.bannedUsers.has(message.userId)) {
      return {
        allowed: false,
        action: 'ban',
        reason: '차단된 사용자입니다',
        severity: 'high'
      }
    }

    // 음소거된 사용자 확인
    const muteEndTime = this.mutedUsers.get(message.userId)
    if (muteEndTime && Date.now() < muteEndTime) {
      return {
        allowed: false,
        action: 'mute',
        reason: '음소거된 사용자입니다',
        severity: 'medium'
      }
    }

    // 스팸 검사
    const spamResult = this.checkSpam(message)
    if (!spamResult.allowed) {
      return spamResult
    }

    // 필터 규칙 적용
    for (const rule of this.filterRules) {
      if (!rule.enabled) continue

      const result = this.applyFilterRule(message, rule)
      if (!result.allowed) {
        return result
      }
    }

    // 메시지 정제
    const cleanedMessage = this.cleanMessage(message.message)
    
    return {
      allowed: true,
      filteredMessage: cleanedMessage !== message.message ? cleanedMessage : undefined
    }
  }

  // 개별 필터 규칙 적용
  private applyFilterRule(message: ChatMessage, rule: FilterRule): FilterResult {
    switch (rule.type) {
      case 'keyword':
        return this.checkKeywords(message, rule)
      case 'regex':
        return this.checkRegex(message, rule)
      case 'spam':
        return this.checkSpamRule(message, rule)
      default:
        return { allowed: true }
    }
  }

  // 키워드 필터 검사
  private checkKeywords(message: ChatMessage, rule: FilterRule): FilterResult {
    const keywords = rule.pattern.toLowerCase().split('|')
    const messageText = message.message.toLowerCase()

    for (const keyword of keywords) {
      if (messageText.includes(keyword.trim())) {
        return {
          allowed: false,
          action: rule.action,
          reason: `금지된 키워드가 포함되어 있습니다: ${keyword.trim()}`,
          severity: rule.severity
        }
      }
    }

    return { allowed: true }
  }

  // 정규식 필터 검사
  private checkRegex(message: ChatMessage, rule: FilterRule): FilterResult {
    try {
      const regex = new RegExp(rule.pattern, 'i')
      const match = regex.exec(message.message)

      if (match) {
        return {
          allowed: false,
          action: rule.action,
          reason: `부적절한 내용이 감지되었습니다`,
          severity: rule.severity
        }
      }
    } catch (error) {
      console.error('Invalid regex pattern:', rule.pattern, error)
    }

    return { allowed: true }
  }

  // 스팸 규칙 검사
  private checkSpamRule(message: ChatMessage, rule: FilterRule): FilterResult {
    const threshold = parseInt(rule.pattern)
    const now = Date.now()
    const timeWindow = 30000 // 30초 윈도우

    // 사용자별 메시지 타임스탬프 업데이트
    if (!this.userMessageCount.has(message.userId)) {
      this.userMessageCount.set(message.userId, [])
    }

    const userMessages = this.userMessageCount.get(message.userId)!
    userMessages.push(now)

    // 오래된 메시지 제거
    const recentMessages = userMessages.filter(timestamp => now - timestamp < timeWindow)
    this.userMessageCount.set(message.userId, recentMessages)

    // 스팸 확인
    if (recentMessages.length > threshold) {
      return {
        allowed: false,
        action: rule.action,
        reason: `스팸으로 감지되었습니다 (${recentMessages.length}개 메시지)`,
        severity: rule.severity
      }
    }

    return { allowed: true }
  }

  // 일반적인 스팸 검사
  private checkSpam(message: ChatMessage): FilterResult {
    const text = message.message

    // 메시지 길이 검사
    if (text.length > 500) {
      return {
        allowed: false,
        action: 'delete',
        reason: '메시지가 너무 깁니다',
        severity: 'medium'
      }
    }

    // 동일 문자 반복 검사
    if (/(.)\1{10,}/.test(text)) {
      return {
        allowed: false,
        action: 'delete',
        reason: '동일한 문자가 과도하게 반복됩니다',
        severity: 'low'
      }
    }

    // 대문자만으로 구성된 긴 메시지 (외침 방지)
    if (text.length > 20 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
      return {
        allowed: false,
        action: 'warn',
        reason: '과도한 대문자 사용',
        severity: 'low'
      }
    }

    return { allowed: true }
  }

  // 메시지 정제 (경미한 문제들을 자동으로 수정)
  private cleanMessage(message: string): string {
    let cleaned = message

    // 과도한 공백 제거
    cleaned = cleaned.replace(/\s{3,}/g, ' ')

    // 과도한 특수문자 반복 제거
    cleaned = cleaned.replace(/([!?.]){3,}/g, '$1$1')

    // 앞뒤 공백 제거
    cleaned = cleaned.trim()

    return cleaned
  }

  // 사용자 차단
  banUser(userId: string) {
    this.bannedUsers.add(userId)
  }

  // 사용자 차단 해제
  unbanUser(userId: string) {
    this.bannedUsers.delete(userId)
  }

  // 사용자 음소거 (분 단위)
  muteUser(userId: string, durationMinutes: number) {
    const unmuteTime = Date.now() + (durationMinutes * 60 * 1000)
    this.mutedUsers.set(userId, unmuteTime)
  }

  // 사용자 음소거 해제
  unmuteUser(userId: string) {
    this.mutedUsers.delete(userId)
  }

  // 필터 규칙 업데이트
  updateFilterRules(rules: FilterRule[]) {
    this.filterRules = rules
  }

  // 통계 정보
  getStats() {
    return {
      bannedUsers: this.bannedUsers.size,
      mutedUsers: this.mutedUsers.size,
      activeRules: this.filterRules.filter(rule => rule.enabled).length
    }
  }
}

// React 컴포넌트로 사용할 때를 위한 훅
import { useState, useEffect, useRef } from 'react'

export function useChatFilter(initialRules: FilterRule[] = []) {
  const filterRef = useRef<ChatFilter>()
  const [stats, setStats] = useState({ bannedUsers: 0, mutedUsers: 0, activeRules: 0 })

  // 필터 인스턴스 초기화
  useEffect(() => {
    filterRef.current = new ChatFilter(initialRules)
    updateStats()
  }, [])

  // 통계 업데이트
  const updateStats = () => {
    if (filterRef.current) {
      setStats(filterRef.current.getStats())
    }
  }

  // 메시지 필터링
  const filterMessage = (message: ChatMessage): FilterResult => {
    if (!filterRef.current) {
      return { allowed: true }
    }
    return filterRef.current.filterMessage(message)
  }

  // 사용자 관리
  const banUser = (userId: string) => {
    filterRef.current?.banUser(userId)
    updateStats()
  }

  const unbanUser = (userId: string) => {
    filterRef.current?.unbanUser(userId)
    updateStats()
  }

  const muteUser = (userId: string, durationMinutes: number) => {
    filterRef.current?.muteUser(userId, durationMinutes)
    updateStats()
  }

  const unmuteUser = (userId: string) => {
    filterRef.current?.unmuteUser(userId)
    updateStats()
  }

  // 필터 규칙 업데이트
  const updateFilterRules = (rules: FilterRule[]) => {
    filterRef.current?.updateFilterRules(rules)
    updateStats()
  }

  return {
    filterMessage,
    banUser,
    unbanUser,
    muteUser,
    unmuteUser,
    updateFilterRules,
    stats
  }
}

export default ChatFilter