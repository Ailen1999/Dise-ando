"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  adminCreateDesign,
  adminUpdateDesign,
  adminGetDesigns,
  adminGetCategories,
  type Category,
  type Design,
} from "@/lib/api"

export default function DesignFormPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params.id === "new"
  const designId = isNew ? null : Number(params.id)

  const [form, setForm] = useState({
    title: "",
    year: new Date().getFullYear().toString(),
    category_id: "",
    image_url: "",
  })
  const [coverMode, setCoverMode] = useState<"url" | "file">("url")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>("")
  const [htmlContent, setHtmlContent] = useState("")
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [existingDesign, setExistingDesign] = useState<Design | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isCoverDragging, setIsCoverDragging] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const cats = await adminGetCategories()
      setCategories(cats)
      if (!isNew && designId) {
        const all = await adminGetDesigns()
        const d = all.find((x) => x.id === designId)
        if (d) {
          setExistingDesign(d)
          setForm({
            title: d.title,
            year: d.year,
            category_id: d.category_id ? String(d.category_id) : "",
            image_url: d.image_url || "",
          })
        }
      }
      setLoading(false)
    }
    init()
  }, [isNew, designId])

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith(".html")) {
      if (file.size > 5 * 1024 * 1024) {
        setError("El archivo supera el límite de 5MB")
        return
      }
      setHtmlFile(file)
      file.text().then(setHtmlContent)
      setError("")
    } else {
      setError("Solo se aceptan archivos .html")
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo supera el límite de 5MB")
      return
    }
    setHtmlFile(file)
    file.text().then(setHtmlContent)
    setError("")
  }, [])

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

  function handlePreview() {
    const content = htmlContent || ""
    if (!content) return
    const blob = new Blob([content], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError("El título es obligatorio")
      return
    }
    if (isNew && !htmlFile && !htmlContent) {
      setError("Es necesario subir un archivo HTML")
      return
    }

    setSaving(true)
    setError("")

    try {
      const fd = new FormData()
      fd.append("title", form.title)
      fd.append("year", form.year)
      if (form.category_id) fd.append("category_id", form.category_id)

      // Cover image: file takes priority over URL
      if (coverMode === "file" && coverFile) {
        fd.append("cover_file", coverFile)
      } else if (coverMode === "url" && form.image_url) {
        fd.append("image_url", form.image_url)
      }

      if (htmlFile) {
        fd.append("html_file", htmlFile)
      } else if (htmlContent && !existingDesign?.html_path) {
        // paste mode — create File from content
        const blob = new Blob([htmlContent], { type: "text/html" })
        fd.append("html_file", new File([blob], `${form.title}.html`))
      }

      if (isNew) {
        await adminCreateDesign(fd)
      } else if (designId) {
        await adminUpdateDesign(designId, fd)
      }
      router.push("/admin/designs")
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
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/designs")}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-4"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver
        </button>
        <h1 className="text-2xl font-semibold text-white">
          {isNew ? "Subir nuevo diseño" : "Editar diseño"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ej. Belletny Home"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Año</label>
            <input
              type="text"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="2024"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Categoría</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all text-sm appearance-none"
            >
              <option value="" className="bg-[#111]">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#111]">
                  {cat.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cover image */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest">Imagen de portada</label>
            {/* Tab switcher */}
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
                  alt="Preview portada"
                  className="mt-3 w-full h-36 object-cover rounded-xl border border-white/10"
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
                isCoverDragging
                  ? "border-white/40 bg-white/5"
                  : coverFile
                  ? "border-white/20"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {coverFile && coverPreview ? (
                <div className="relative">
                  <img
                    src={coverPreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    <label className="cursor-pointer text-xs text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm transition-all">
                      Cambiar imagen
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleCoverFile(e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); setCoverPreview("") }}
                    className="absolute top-2 right-2 bg-black/60 text-white/70 hover:text-white p-1.5 rounded-lg transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  </button>
                  <span className="absolute bottom-2 left-3 text-xs text-white/60 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">{coverFile.name}</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center px-6 py-8 cursor-pointer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-10 h-10 mb-3 text-white/20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <p className="text-sm text-white/40 mb-1">Arrastrá la imagen acá o hacé clic</p>
                  <p className="text-xs text-white/25">JPG, PNG, WebP o GIF · Máx 10MB</p>
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleCoverFile(e.target.files[0])} className="hidden" />
                </label>
              )}
            </div>
          )}
        </div>

        {/* HTML Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest">
              Archivo HTML {isNew && "*"}
            </label>
            {htmlContent && (
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Vista previa
              </button>
            )}
          </div>

          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl transition-all ${
              isDragging
                ? "border-white/40 bg-white/5"
                : htmlFile
                ? "border-green-500/40 bg-green-500/5"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            {htmlFile ? (
              <div className="px-6 py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{htmlFile.name}</div>
                  <div className="text-xs text-white/40">{(htmlFile.size / 1024).toFixed(1)} KB</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setHtmlFile(null); setHtmlContent("") }}
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-10 h-10 mx-auto mb-3 text-white/20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-white/40 mb-1">
                  Arrastrá el archivo HTML acá
                </p>
                <p className="text-xs text-white/25 mb-4">Máximo 5MB</p>
                <label className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg cursor-pointer transition-all">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                  </svg>
                  Seleccionar archivo
                  <input
                    type="file"
                    accept=".html"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Paste HTML textarea */}
          <div className="mt-3">
            <label className="block text-xs text-white/30 mb-2">
              ...o pegá el código HTML directamente:
            </label>
            <textarea
              value={htmlContent}
              onChange={(e) => {
                setHtmlContent(e.target.value)
                setHtmlFile(null)
              }}
              placeholder="<!DOCTYPE html>..."
              rows={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-all text-xs font-mono resize-none"
            />
          </div>

          {existingDesign?.html_path && !htmlFile && !htmlContent && (
            <div className="mt-2 flex items-center gap-2 text-xs text-white/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Archivo actual: <span className="font-mono">{existingDesign.html_path}</span>
              <span>— dejá vacío para mantenerlo</span>
            </div>
          )}
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
            {saving ? "Guardando..." : isNew ? "Subir diseño" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/designs")}
            className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
