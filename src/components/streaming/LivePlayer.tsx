'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import flvjs from 'flv.js'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface LivePlayerProps {
  streamUrl: string
  streamType: 'hls' | 'flv' | 'webrtc'
  autoPlay?: boolean
  muted?: boolean
  controls?: boolean
  onError?: (error: any) => void
  onViewerCountUpdate?: (count: number) => void
  className?: string
}

export default function LivePlayer({
  streamUrl,
  streamType,
  autoPlay = true,
  muted = false,
  controls = true,
  onError,
  onViewerCountUpdate,
  className = ''
}: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quality, setQuality] = useState<string>('auto')
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [volume, setVolume] = useState(muted ? 0 : 1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [latency, setLatency] = useState(0)
  const [stats, setStats] = useState({
    fps: 0,
    bitrate: 0,
    droppedFrames: 0,
    bufferLength: 0
  })

  // HLS 플레이어 초기화
  const initHLS = useCallback(() => {
    if (!videoRef.current || !Hls.isSupported()) {
      // iOS Safari는 네이티브 HLS 지원
      if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl
        return
      }
      setError('HLS is not supported in this browser')
      return
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
      maxBufferLength: 10,
      maxMaxBufferLength: 30,
      maxBufferSize: 60 * 1000 * 1000, // 60MB
      maxBufferHole: 0.5,
      highBufferWatchdogPeriod: 2,
      nudgeOffset: 0.1,
      nudgeMaxRetry: 3,
      maxFragLookUpTolerance: 0.25,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      liveDurationInfinity: true,
      preferManagedMediaSource: true
    })

    hls.loadSource(streamUrl)
    hls.attachMedia(videoRef.current)

    // 이벤트 리스너
    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      console.log('Manifest loaded, found ' + data.levels.length + ' quality levels')
      
      // 사용 가능한 품질 레벨 설정
      const qualities = data.levels.map((level: any, index: number) => {
        if (level.height) {
          return `${level.height}p`
        }
        return `Level ${index}`
      })
      qualities.unshift('auto')
      setAvailableQualities(qualities)
      
      setIsLoading(false)
      if (autoPlay) {
        videoRef.current?.play()
      }
    })

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS Error:', data)
      
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('Fatal network error encountered, trying to recover')
            hls.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('Fatal media error encountered, trying to recover')
            hls.recoverMediaError()
            break
          default:
            setError('Fatal error: ' + data.details)
            hls.destroy()
            break
        }
      }
      
      if (onError) {
        onError(data)
      }
    })

    // 통계 업데이트
    hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      const video = videoRef.current
      if (!video) return

      const videoData = video as any
      const droppedFrames = videoData.webkitDroppedFrameCount || 
                           videoData.mozParsedFrames - videoData.mozDecodedFrames || 
                           0

      setStats({
        fps: Math.round(data.stats.fps || 0),
        bitrate: Math.round(data.stats.bw / 1000), // Kbps
        droppedFrames: droppedFrames,
        bufferLength: Math.round(hls.media?.buffered.end(0) - hls.media?.currentTime || 0)
      })

      // 레이턴시 계산
      if (hls.latency) {
        setLatency(Math.round(hls.latency * 1000)) // ms
      }
    })

    // 품질 변경 처리
    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      console.log('Quality level switched to', data.level)
    })

    playerRef.current = hls

    return () => {
      hls.destroy()
    }
  }, [streamUrl, autoPlay, onError])

  // FLV 플레이어 초기화
  const initFLV = useCallback(() => {
    if (!videoRef.current || !flvjs.isSupported()) {
      setError('FLV is not supported in this browser')
      return
    }

    const flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: streamUrl,
      isLive: true,
      enableWorker: true,
      enableStashBuffer: false,
      stashInitialSize: 128,
      lazyLoad: false,
      lazyLoadMaxDuration: 0,
      lazyLoadRecoverDuration: 0,
      deferLoadAfterSourceOpen: false,
      fixAudioTimestampGap: true,
      autoCleanupSourceBuffer: true
    }, {
      enableStashBuffer: false,
      stashInitialSize: 128,
      isLive: true,
      lazyLoad: false
    })

    flvPlayer.attachMediaElement(videoRef.current)
    flvPlayer.load()

    flvPlayer.on(flvjs.Events.ERROR, (errorType, errorDetail, errorInfo) => {
      console.error('FLV Error:', errorType, errorDetail, errorInfo)
      setError(`FLV Error: ${errorDetail}`)
      
      if (onError) {
        onError({ type: errorType, detail: errorDetail, info: errorInfo })
      }
    })

    flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
      console.log('FLV Loading complete')
    })

    flvPlayer.on(flvjs.Events.STATISTICS_INFO, (stats) => {
      setStats({
        fps: Math.round(stats.currentFPS || 0),
        bitrate: Math.round(stats.speed || 0),
        droppedFrames: stats.droppedFrames || 0,
        bufferLength: 0
      })
    })

    setIsLoading(false)
    if (autoPlay) {
      flvPlayer.play()
    }

    playerRef.current = flvPlayer

    return () => {
      flvPlayer.destroy()
    }
  }, [streamUrl, autoPlay, onError])

  // WebRTC 플레이어 초기화 (저지연)
  const initWebRTC = useCallback(async () => {
    if (!videoRef.current) return

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      })

      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0]
        }
      }

      // WebRTC 시그널링 로직 (WebSocket 통해)
      // 실제 구현시 시그널링 서버와 통신 필요
      
      setIsLoading(false)
      
      playerRef.current = pc

      return () => {
        pc.close()
      }
    } catch (error) {
      console.error('WebRTC Error:', error)
      setError('WebRTC initialization failed')
      if (onError) {
        onError(error)
      }
    }
  }, [onError])

  // 플레이어 초기화
  useEffect(() => {
    let cleanup: (() => void) | undefined

    switch (streamType) {
      case 'hls':
        cleanup = initHLS()
        break
      case 'flv':
        cleanup = initFLV()
        break
      case 'webrtc':
        initWebRTC()
        break
    }

    return () => {
      if (cleanup) cleanup()
      if (playerRef.current) {
        if (streamType === 'hls' || streamType === 'flv') {
          playerRef.current.destroy?.()
        } else if (streamType === 'webrtc') {
          playerRef.current.close?.()
        }
      }
    }
  }, [streamUrl, streamType, initHLS, initFLV, initWebRTC])

  // 비디오 이벤트 핸들러
  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  // 품질 변경
  const handleQualityChange = (newQuality: string) => {
    if (!playerRef.current || streamType !== 'hls') return

    const hls = playerRef.current
    if (newQuality === 'auto') {
      hls.currentLevel = -1
    } else {
      const levelIndex = availableQualities.indexOf(newQuality) - 1
      if (levelIndex >= 0) {
        hls.currentLevel = levelIndex
      }
    }
    setQuality(newQuality)
  }

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }

  // PiP (Picture in Picture) 모드
  const togglePiP = async () => {
    if (!videoRef.current) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (error) {
      console.error('PiP Error:', error)
    }
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* 비디오 엘리먼트 */}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={controls}
        muted={muted}
        playsInline
        onPlay={handlePlay}
        onPause={handlePause}
      />

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading stream...</p>
          </div>
        </div>
      )}

      {/* 에러 오버레이 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Card className="p-6 bg-red-900/90 text-white">
            <h3 className="text-lg font-bold mb-2">Stream Error</h3>
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Reload
            </Button>
          </Card>
        </div>
      )}

      {/* 커스텀 컨트롤 오버레이 */}
      {!controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            {/* 재생/일시정지 버튼 */}
            <Button
              onClick={() => {
                if (isPlaying) {
                  videoRef.current?.pause()
                } else {
                  videoRef.current?.play()
                }
              }}
              variant="ghost"
              className="text-white"
            >
              {isPlaying ? '⏸' : '▶'}
            </Button>

            {/* 볼륨 컨트롤 */}
            <div className="flex items-center gap-2">
              <span className="text-white">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24"
              />
            </div>

            {/* 품질 선택 */}
            {availableQualities.length > 0 && (
              <select
                value={quality}
                onChange={(e) => handleQualityChange(e.target.value)}
                className="bg-black/50 text-white px-2 py-1 rounded"
              >
                {availableQualities.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            )}

            {/* PiP 버튼 */}
            <Button
              onClick={togglePiP}
              variant="ghost"
              className="text-white"
              title="Picture in Picture"
            >
              PiP
            </Button>

            {/* 전체화면 버튼 */}
            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              className="text-white"
            >
              {isFullscreen ? '◱' : '◰'}
            </Button>
          </div>
        </div>
      )}

      {/* 라이브 인디케이터 & 통계 */}
      <div className="absolute top-4 left-4 flex items-center gap-4">
        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          ● LIVE
        </div>
        
        {viewerCount > 0 && (
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            👥 {viewerCount.toLocaleString()} viewers
          </div>
        )}
        
        {latency > 0 && (
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            ⚡ {latency}ms
          </div>
        )}
      </div>

      {/* 디버그 통계 (개발 모드) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs p-2 rounded font-mono">
          <div>FPS: {stats.fps}</div>
          <div>Bitrate: {stats.bitrate} Kbps</div>
          <div>Dropped: {stats.droppedFrames}</div>
          <div>Buffer: {stats.bufferLength}s</div>
        </div>
      )}
    </div>
  )
}