'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Settings,
  SkipBack,
  SkipForward
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils/video'

interface VideoPlayerProps {
  videoUrl?: string
  thumbnailUrl: string
  title: string
  duration?: number
  autoPlay?: boolean
  muted?: boolean
  className?: string
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
}

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  duration = 0,
  autoPlay = false,
  muted = false,
  className,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(duration)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(true)

  // 마우스 움직임 감지를 위한 타이머
  const controlsTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      const current = video.currentTime
      setCurrentTime(current)
      onTimeUpdate?.(current)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setShowThumbnail(false)
      onPlay?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setShowThumbnail(true)
      onEnded?.()
    }

    const handleWaiting = () => {
      setIsBuffering(true)
    }

    const handleCanPlayThrough = () => {
      setIsBuffering(false)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplaythrough', handleCanPlayThrough)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
    }
  }, [onPlay, onPause, onTimeUpdate, onEnded])

  // 컨트롤 자동 숨김
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
      controlsTimerRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }, 3000)
    }

    const player = playerRef.current
    if (player) {
      player.addEventListener('mousemove', handleMouseMove)
      player.addEventListener('mouseleave', () => {
        if (isPlaying) {
          setShowControls(false)
        }
      })
      player.addEventListener('mouseenter', () => {
        setShowControls(true)
      })
    }

    return () => {
      if (player) {
        player.removeEventListener('mousemove', handleMouseMove)
      }
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
    }
  }, [isPlaying])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || videoDuration === 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * videoDuration
    
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(videoDuration, video.currentTime + seconds))
  }

  const toggleFullscreen = () => {
    const player = playerRef.current
    if (!player) return

    if (!document.fullscreenElement) {
      player.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current?.contains(document.activeElement)) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'KeyM':
          toggleMute()
          break
        case 'KeyF':
          toggleFullscreen()
          break
        case 'ArrowLeft':
          skip(-10)
          break
        case 'ArrowRight':
          skip(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.1))
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [volume])

  const progressPercentage = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0

  return (
    <div 
      ref={playerRef}
      className={cn(
        'relative bg-black rounded-xl overflow-hidden aspect-video group focus-within:outline-none',
        className
      )}
      tabIndex={0}
    >
      {/* 비디오 요소 */}
      {videoUrl ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={videoUrl}
          autoPlay={autoPlay}
          muted={isMuted}
          playsInline
        />
      ) : (
        // 썸네일 표시 (비디오 URL이 없을 때)
        <>
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
          />
          {showThumbnail && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
            </div>
          )}
        </>
      )}

      {/* 버퍼링 표시 */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      {/* 컨트롤 오버레이 */}
      <div 
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* 중앙 재생 버튼 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </Button>
        </div>

        {/* 하단 컨트롤 바 */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* 진행 바 */}
          <div 
            className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer group/progress"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-indigo-500 rounded-full relative transition-all group-hover/progress:h-1.5"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>
          
          {/* 컨트롤 버튼들 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-10 h-10"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-8 h-8"
                onClick={() => skip(-10)}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-8 h-8"
                onClick={() => skip(10)}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-8 h-8"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              
              {/* 볼륨 슬라이더 */}
              <div className="group/volume relative">
                <div className="w-0 group-hover/volume:w-20 transition-all duration-200 overflow-hidden">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <span className="text-white text-sm ml-2">
                {formatDuration(currentTime)} / {formatDuration(videoDuration)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-8 h-8"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-8 h-8"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 클릭으로 재생/일시정지 */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={togglePlay}
      />
    </div>
  )
}