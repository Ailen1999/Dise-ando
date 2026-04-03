"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { adminGetDesigns, adminGetCategories, adminDeleteDesign, type Design, type Category } from "@/lib/api"

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  async function load() {
    try {
      const [d, c] = await Promise.all([adminGetDesigns(), adminGetCategories()])
      setDesigns(d)
      setCategories(c)
    } catch {
      setError("No se pudieron cargar los diseños")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function getCategoryName(id: number | null) {
    if (!id) return "Sin categoría"
    return categories.find((c) => c.id === id)?.title || "—"
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`¿Eliminar el diseño "${title}"? Se eliminará también el archivo HTML.`)) return
    setDeletingId(id)
    try {
      await adminDeleteDesign(id)
      setDesigns((prev) => prev.filter((d) => d.id !== id))
    } catch (err: unknown) {
      alert("Error al eliminar: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Diseños</h1>
          <p className="text-white/40 text-sm mt-0.5">Archivos HTML en la galería pública</p>
        </div>
        <Link
          href="/admin/designs/new"
          className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Subir diseño
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : designs.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-16 h-16 mx-auto mb-4 opacity-30">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
          </svg>
          <p className="text-lg">No hay diseños</p>
          <p className="text-sm mt-1">Subí tu primer diseño HTML</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {designs.map((design) => (
            <div
              key={design.id}
              className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all group"
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-white/5">
                {design.image_url ? (
                  <img
                    src={design.image_url}
                    alt={design.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-white/20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  </div>
                )}
                {/* Category badge */}
                <span className="absolute top-2 left-2 text-xs bg-black/60 backdrop-blur-sm text-white/70 px-2 py-0.5 rounded-md">
                  {getCategoryName(design.category_id)}
                </span>
                {/* Preview link */}
                {design.html_path && (
                  <a
                    href={design.html_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm text-white/70 hover:text-white p-1.5 rounded-md"
                    title="Ver diseño"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-white leading-tight">{design.title}</span>
                  <span className="text-xs text-white/30 flex-shrink-0">{design.year}</span>
                </div>
                {design.html_path && (
                  <span className="text-xs text-white/30 font-mono">{design.html_path}</span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <Link
                    href={`/admin/designs/${design.id}`}
                    className="flex-1 text-center text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(design.id, design.title)}
                    disabled={deletingId === design.id}
                    className="text-xs text-red-400/60 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                  >
                    {deletingId === design.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
