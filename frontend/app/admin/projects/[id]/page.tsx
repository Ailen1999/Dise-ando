"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { adminCreateProject, adminUpdateProject, adminGetProjects, type Project } from "@/lib/api"

export default function ProjectFormPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params.id === "new"
  const projectId = isNew ? null : Number(params.id)

  const [form, setForm] = useState({
    title: "",
    description: "",
    technologies: "",
    image_url: "",
    external_url: "",
    sort_order: 0,
  })
  const [coverMode, setCoverMode] = useState<"url" | "file">("url")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>("")
  const [isCoverDragging, setIsCoverDragging] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isNew && projectId) {
      adminGetProjects()
        .then((projects) => {
          const p = projects.find((x) => x.id === projectId)
          if (p) {
            const techs = (() => {
              try { return (JSON.parse(p.technologies) as string[]).join(", ") } catch { return p.technologies || "" }
            })()
            setForm({
              title: p.title,
              description: p.description || "",
              technologies: techs,
              image_url: p.image_url || "",
              external_url: p.external_url || "",
              sort_order: p.sort_order,
            })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [isNew, projectId])

  const handleCoverFile = useCallback((file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      setError("Solo se aceptan imágenes JPG, PNG, WebP o GIF")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen supera el límite de 10MB")
      return
    }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setError("")
  }, [])

  const handleCoverDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsCoverDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleCoverFile(file)
  }, [handleCoverFile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError("El título es obligatorio"); return }
    setSaving(true)
    setError("")

    // Convert comma-separated tech string to JSON array
    const techArray = form.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    const fd = new FormData()
    fd.append("title", form.title)
    fd.append("description", form.description)
    fd.append("technologies", JSON.stringify(techArray))
    fd.append("external_url", form.external_url)
    fd.append("sort_order", String(form.sort_order))

    // Cover image logic: file takes priority
    if (coverMode === "file" && coverFile) {
      fd.append("cover_file", coverFile)
    } else {
      fd.append("image_url", form.image_url)
    }

    try {
      if (isNew) {
        await adminCreateProject(fd)
      } else if (projectId) {
        await adminUpdateProject(projectId, fd)
      }
      router.push("/admin/projects")
    } catch (err) {
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
        <button onClick={() => router.push("/admin/projects")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver
        </button>
        <h1 className="text-2xl font-semibold text-white">{isNew ? "Nuevo proyecto" : "Editar proyecto"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Título *</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-sm" placeholder="Nombre del proyecto" />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Descripción</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-sm resize-none" placeholder="Descripción del proyecto..." />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Tecnologías</label>
          <input type="text" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-sm" placeholder="React, Next.js, TypeScript, ..." />
          <p className="text-xs text-white/25 mt-1.5">Separalas con comas</p>
        </div>

        {/* Cover image Multi-source */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest">Imagen de portada / GIF</label>
            <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setCoverMode("url")}
                className={`text-xs px-3 py-1 rounded-md transition-all ${
                  coverMode === "url" ? "bg-white text-black font-semibold" : "text-white/40 hover:text-white"
                }`}
              >URL</button>
              <button
                type="button"
                onClick={() => setCoverMode("file")}
                className={`text-xs px-3 py-1 rounded-md transition-all ${
                  coverMode === "file" ? "bg-white text-black font-semibold" : "text-white/40 hover:text-white"
                }`}
              >Archivo</button>
            </div>
          </div>

          {coverMode === "url" ? (
            <div>
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
                  className="mt-3 w-full h-32 object-cover rounded-xl border border-white/10"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsCoverDragging(true) }}
              onDragLeave={() => setIsCoverDragging(false)}
              onDrop={handleCoverDrop}
              className={`relative border-2 border-dashed rounded-2xl transition-all ${
                isCoverDragging ? "border-white/40 bg-white/5" : coverFile ? "border-white/20" : "border-white/10 hover:border-white/20"
              }`}
            >
              {coverFile && coverPreview ? (
                <div className="relative">
                  <img src={coverPreview} alt="Preview" className="w-full h-32 object-cover rounded-2xl font-mono" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    <label className="cursor-pointer text-xs text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm transition-all">
                      Cambiar archivo
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleCoverFile(e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                  <button type="button" onClick={() => { setCoverFile(null); setCoverPreview("") }} className="absolute top-2 right-2 bg-black/60 text-white/70 hover:text-white p-1.5 rounded-lg transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center px-6 py-8 cursor-pointer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-10 h-10 mb-3 text-white/20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <p className="text-sm text-white/40 mb-1 font-mono">Arrastrá el GIF o imagen acá</p>
                  <p className="text-xs text-white/25">Máx 10MB</p>
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleCoverFile(e.target.files[0])} className="hidden" />
                </label>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Link externo (opcional)</label>
          <input type="url" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-sm" placeholder="https://github.com/..." />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Orden</label>
          <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} min={0} className="w-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all text-sm" />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-white text-black font-semibold px-6 py-2.5 rounded-xl hover:bg-white/90 disabled:opacity-40 transition-all text-sm">
            {saving ? "Guardando..." : isNew ? "Crear proyecto" : "Guardar cambios"}
          </button>
          <button type="button" onClick={() => router.push("/admin/projects")} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl transition-all text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
