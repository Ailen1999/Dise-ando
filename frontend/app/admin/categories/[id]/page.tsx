"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { adminCreateCategory, adminUpdateCategory, adminGetCategories, type Category } from "@/lib/api"

export default function CategoryFormPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params.id === "new"
  const categoryId = isNew ? null : Number(params.id)

  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    sort_order: 0,
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isNew && categoryId) {
      adminGetCategories()
        .then((cats) => {
          const cat = cats.find((c) => c.id === categoryId)
          if (cat) {
            setForm({
              title: cat.title,
              description: cat.description || "",
              image_url: cat.image_url || "",
              sort_order: cat.sort_order,
            })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [isNew, categoryId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError("El título es obligatorio")
      return
    }
    setSaving(true)
    setError("")
    try {
      if (isNew) {
        await adminCreateCategory(form)
      } else if (categoryId) {
        await adminUpdateCategory(categoryId, form)
      }
      router.push("/admin/categories")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/categories")}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-4"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver
        </button>
        <h1 className="text-2xl font-semibold text-white">
          {isNew ? "Nueva categoría" : "Editar categoría"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
            Título *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="ej. Gastronomía"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
            Descripción
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descripción breve de la categoría..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-sm resize-none"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
            URL de imagen de portada
          </label>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
          {form.image_url && (
            <img
              src={form.image_url}
              alt="Preview"
              className="mt-3 w-full h-40 object-cover rounded-xl border border-white/10"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
            Orden
          </label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
            min={0}
            className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black font-semibold px-6 py-2.5 rounded-xl hover:bg-white/90 disabled:opacity-40 transition-all text-sm"
          >
            {saving ? "Guardando..." : isNew ? "Crear categoría" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/categories")}
            className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
