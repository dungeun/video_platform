'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function FireworksAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isAnimatingRef = useRef(false)

  useEffect(() => {
    const handleSuperChat = (event: CustomEvent) => {
      if (isAnimatingRef.current || !containerRef.current) return
      
      isAnimatingRef.current = true
      const amount = event.detail.amount
      
      // 금액에 따라 폭죽 개수 조절
      let fireworksCount = 5
      if (amount >= 50000) fireworksCount = 8
      if (amount >= 100000) fireworksCount = 12
      
      createFireworks(fireworksCount)
      
      // 애니메이션 종료 후 플래그 리셋
      setTimeout(() => {
        isAnimatingRef.current = false
      }, 3000)
    }

    window.addEventListener('superchat-sent', handleSuperChat as EventListener)
    
    return () => {
      window.removeEventListener('superchat-sent', handleSuperChat as EventListener)
    }
  }, [])

  const createFireworks = (count: number) => {
    if (!containerRef.current) return

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        createSingleFirework()
      }, i * 200)
    }
  }

  const createSingleFirework = () => {
    if (!containerRef.current) return

    const firework = document.createElement('div')
    firework.className = 'firework'
    
    // 랜덤 위치 설정
    const startX = Math.random() * window.innerWidth
    const startY = window.innerHeight
    const endX = startX + (Math.random() - 0.5) * 400
    const endY = Math.random() * window.innerHeight * 0.5
    
    firework.style.position = 'fixed'
    firework.style.left = `${startX}px`
    firework.style.top = `${startY}px`
    firework.style.width = '6px'
    firework.style.height = '6px'
    firework.style.borderRadius = '50%'
    firework.style.backgroundColor = '#FFD700'
    firework.style.boxShadow = '0 0 10px #FFD700'
    firework.style.pointerEvents = 'none'
    firework.style.zIndex = '9999'
    
    containerRef.current.appendChild(firework)
    
    // 로켓 상승 애니메이션
    const tl = gsap.timeline({
      onComplete: () => {
        firework.remove()
      }
    })
    
    tl.to(firework, {
      x: endX - startX,
      y: endY - startY,
      duration: 0.8,
      ease: 'power2.out'
    })
    .to(firework, {
      opacity: 0,
      duration: 0.1,
      onComplete: () => {
        createExplosion(endX, endY)
      }
    }, '-=0.1')
  }

  const createExplosion = (x: number, y: number) => {
    if (!containerRef.current) return

    const colors = ['#FFD700', '#FF69B4', '#00FFFF', '#FF4500', '#32CD32', '#FF1493']
    const particleCount = 30
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      
      const angle = (Math.PI * 2 * i) / particleCount
      const velocity = 100 + Math.random() * 100
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      particle.style.position = 'fixed'
      particle.style.left = `${x}px`
      particle.style.top = `${y}px`
      particle.style.width = '4px'
      particle.style.height = '4px'
      particle.style.borderRadius = '50%'
      particle.style.backgroundColor = color
      particle.style.boxShadow = `0 0 6px ${color}`
      particle.style.pointerEvents = 'none'
      particle.style.zIndex = '9999'
      
      containerRef.current.appendChild(particle)
      
      // 파티클 애니메이션
      gsap.to(particle, {
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + Math.random() * 50,
        opacity: 0,
        scale: 0.5,
        duration: 1.5,
        ease: 'power2.out',
        onComplete: () => {
          particle.remove()
        }
      })
      
      // 반짝이는 효과
      gsap.to(particle, {
        scale: 1.5,
        duration: 0.15,
        repeat: 2,
        yoyo: true,
        ease: 'power2.inOut'
      })
    }
    
    // 중앙에 큰 플래시 효과
    const flash = document.createElement('div')
    flash.style.position = 'fixed'
    flash.style.left = `${x}px`
    flash.style.top = `${y}px`
    flash.style.width = '100px'
    flash.style.height = '100px'
    flash.style.borderRadius = '50%'
    flash.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
    flash.style.boxShadow = '0 0 50px rgba(255, 255, 255, 0.8)'
    flash.style.transform = 'translate(-50%, -50%)'
    flash.style.pointerEvents = 'none'
    flash.style.zIndex = '9998'
    
    containerRef.current.appendChild(flash)
    
    gsap.to(flash, {
      scale: 3,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        flash.remove()
      }
    })
  }

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  )
}