"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { adminGetCategories, adminDeleteCategory, type Category } from "@/lib/api"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  async function load() {
    try {
      const data = await adminGetCategories()
      setCategories(data)
    } catch {
      setError("No se pudieron cargar las categorías")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: number, title: string) {
    if (!confirm(`¿Eliminar la categoría "${title}"?`)) return
    setDeletingId(id)
    try {
      await adminDeleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes("has designs")) {
        if (confirm(`Esta categoría tiene diseños asociados. ¿Eliminarla de todas formas?`)) {
          await adminDeleteCategory(id, true)
          setCategories((prev) => prev.filter((c) => c.id !== id))
        }
      } else {
        alert("Error al eliminar: " + message)
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Categorías</h1>
          <p className="text-white/40 text-sm mt-0.5">Agrupaciones de diseños en la galería</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva categoría
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <p className="text-lg">No hay categorías</p>
          <p className="text-sm mt-1">Creá la primera para empezar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 bg-white/[0.03] border border-white/8 rounded-xl px-5 py-4 hover:bg-white/[0.05] transition-all"
            >
              {/* Preview image */}
              {cat.image_url ? (
                <img
                  src={cat.image_url}
                  alt={cat.title}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-white/5"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-white/20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{cat.title}</div>
                <div className="text-xs text-white/40 truncate mt-0.5">{cat.description || "Sin descripción"}</div>
              </div>

              {/* Sort order badge */}
              <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-md">#{cat.sort_order}</span>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/categories/${cat.id}`}
                  className="text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(cat.id, cat.title)}
                  disabled={deletingId === cat.id}
                  className="text-xs text-red-400/60 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                >
                  {deletingId === cat.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
