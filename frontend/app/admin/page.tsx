"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { adminGetCategories, adminGetDesigns, adminGetProjects } from "@/lib/api"

interface Stats {
  categories: number
  designs: number
  projects: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ categories: 0, designs: 0, projects: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [cats, designs, projects] = await Promise.all([
          adminGetCategories(),
          adminGetDesigns(),
          adminGetProjects(),
        ])
        setStats({
          categories: cats.length,
          designs: designs.length,
          projects: projects.length,
        })
      } catch (err) {
        console.error("Failed to load stats", err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const cards = [
    {
      label: "Categorías",
      value: stats.categories,
      href: "/admin/categories",
      description: "Agrupaciones de diseños",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
      ),
    },
    {
      label: "Diseños",
      value: stats.designs,
      href: "/admin/designs",
      description: "HTMLs en la galería",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
        </svg>
      ),
    },
    {
      label: "Proyectos",
      value: stats.projects,
      href: "/admin/projects",
      description: "En el portafolio principal",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-white tracking-tight">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Resumen del contenido del portafolio</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/15 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/40 group-hover:text-white/60 transition-colors">{card.icon}</div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {loading ? <span className="opacity-30">—</span> : card.value}
            </div>
            <div className="text-sm font-medium text-white/60">{card.label}</div>
            <div className="text-xs text-white/30 mt-0.5">{card.description}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-medium text-white/30 uppercase tracking-widest mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            href="/admin/designs/new"
            className="flex items-center gap-4 bg-white/[0.03] border border-white/8 rounded-xl px-5 py-4 hover:bg-white/[0.06] hover:border-white/15 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-white/60">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-white">Subir nuevo diseño</div>
              <div className="text-xs text-white/30">Cargar un archivo HTML a la galería</div>
            </div>
          </Link>
          <Link
            href="/admin/categories/new"
            className="flex items-center gap-4 bg-white/[0.03] border border-white/8 rounded-xl px-5 py-4 hover:bg-white/[0.06] hover:border-white/15 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-white/60">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-white">Nueva categoría</div>
              <div className="text-xs text-white/30">Crear una categoría para agrupar diseños</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
