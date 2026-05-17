"use client"

import { useEffect, useRef } from "react"

export function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef({ x: 0, y: 0 })
  const targetPositionRef = useRef({ x: 0, y: 0 })
  const isPointerRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const animationFrameIdRef = useRef<number>(0)

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor
    }

    const updateCursor = () => {
      positionRef.current.x = lerp(positionRef.current.x, targetPositionRef.current.x, 0.5)
      positionRef.current.y = lerp(positionRef.current.y, targetPositionRef.current.y, 0.5)

      if (outerRef.current && innerRef.current) {
        const scale = isPointerRef.current ? 1.5 : 1
        const innerScale = isPointerRef.current ? 0.5 : 1

        outerRef.current.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0) translate(-50%, -50%) scale(${scale})`
        innerRef.current.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0) translate(-50%, -50%) scale(${innerScale})`
      }

      // Stop the loop when the cursor has converged (less than 0.5px difference)
      const dx = Math.abs(positionRef.current.x - targetPositionRef.current.x)
      const dy = Math.abs(positionRef.current.y - targetPositionRef.current.y)
      if (dx < 0.5 && dy < 0.5) {
        isAnimatingRef.current = false
        return
      }

      animationFrameIdRef.current = requestAnimationFrame(updateCursor)
    }

    const startAnimation = () => {
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true
        animationFrameIdRef.current = requestAnimationFrame(updateCursor)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetPositionRef.current = { x: e.clientX, y: e.clientY }

      const target = e.target as HTMLElement
      isPointerRef.current =
        target instanceof HTMLElement &&
        (window.getComputedStyle(target).cursor === "pointer" || target.tagName === "BUTTON" || target.tagName === "A")

      startAnimation()
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationFrameIdRef.current)
    }
  }, [])

  return (
    <>
      <div
        ref={outerRef}
        className="pointer-events-none fixed left-0 top-0 z-50 mix-blend-difference will-change-transform"
        style={{ contain: "layout style paint" }}
      >
        <div className="h-4 w-4 rounded-full border-2 border-white" />
      </div>
      <div
        ref={innerRef}
        className="pointer-events-none fixed left-0 top-0 z-50 mix-blend-difference will-change-transform"
        style={{ contain: "layout style paint" }}
      >
        <div className="h-2 w-2 rounded-full bg-white" />
      </div>
    </>
  )
}
