"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"

function DesignViewer() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const path = searchParams.get("path")
  const title = searchParams.get("title") || "Diseño"

  if (!path) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white/50">
        <p>Diseño no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Floating back button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-black/90 hover:border-white/30 transition-all duration-300 shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          <span>Volver a diseños</span>
        </button>
      </div>

      {/* Title chip (top right) */}
      <div className="absolute top-4 right-4 z-50">
        <span className="rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 text-xs font-mono text-white/50 tracking-widest uppercase">
          {title}
        </span>
      </div>

      {/* Design iframe */}
      <iframe
        src={path}
        title={title}
        className="h-full w-full border-0"
        allow="fullscreen"
        loading="eager"
      />
    </div>
  )
}

export default function DesignViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <DesignViewer />
    </Suspense>
  )
}
