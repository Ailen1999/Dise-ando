"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WebglBackground } from "@/components/webgl-background"
import { CatalogNav } from "@/components/catalog-nav"
import { CustomCursor } from "@/components/custom-cursor"
import { CategoryCard } from "@/components/category-card"
import { ArrowLeft } from "lucide-react"
import { getCategories, getDesigns, type Category, type Design } from "@/lib/api"

export default function DesignsCatalog() {
  const [categories, setCategories] = useState<Category[]>([])
  const [designs, setDesigns] = useState<Design[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cats, all] = await Promise.all([getCategories(), getDesigns()])
        setCategories(cats)
        setDesigns(all)
      } catch (err) {
        console.error("Failed to load from API, using empty state", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeCategory = categories.find((c) => c.id === selectedCategoryId)
  const activeDesigns = designs.filter((d) => d.category_id === selectedCategoryId)

  function handleSelectCategory(id: number) {
    setSelectedCategoryId(id)
  }

  return (
    <main className="relative min-h-screen w-full bg-background font-sans text-white overflow-x-hidden">
      <WebglBackground />
      <CustomCursor />
      <CatalogNav />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-8 pt-40 pb-20 lg:px-24">

        <AnimatePresence mode="wait">
          {!selectedCategoryId ? (
            <motion.div
              key="categories-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="mb-16 md:mb-24">
                <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-light tracking-tighter leading-none opacity-90 mb-4">
                  Diseños
                </h1>
                <p className="ml-2 font-mono text-xs md:text-sm uppercase tracking-[0.3em] opacity-60">
                  / Exploración por Categorías
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  {categories.map((cat, index) => {
                    const count = designs.filter((d) => d.category_id === cat.id).length
                    return (
                      <CategoryCard
                        key={cat.id}
                        suppressHydrationWarning
                        category={String(cat.id)}
                        title={cat.title}
                        image={cat.image_url}
                        count={count}
                        onClick={() => handleSelectCategory(cat.id)}
                        className={index === 1 || index === 2 ? "md:mt-12" : ""}
                      />
                    )
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`gallery-${selectedCategoryId}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="min-h-[60vh]"
            >
              <div className="mb-16">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className="mb-8 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a categorías
                </button>

                <h2 className="text-5xl md:text-7xl font-light tracking-tighter mb-4">
                  {activeCategory?.title}
                </h2>
                <p className="max-w-2xl text-lg text-white/60 leading-relaxed">
                  {activeCategory?.description}
                </p>
              </div>

              {activeDesigns.length === 0 ? (
                <div className="flex items-center justify-center py-32 text-white/30">
                  <p className="text-xl font-light">No hay diseños en esta categoría aún.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {activeDesigns.map((design, i) => {
                    const hasLink = !!design.html_path

                    const content = (
                      <>
                        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white/5">
                          {design.image_url ? (
                            <img
                              src={design.image_url}
                              alt={design.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12 text-white/10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />

                          {hasLink && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="rounded-full border border-white bg-black/20 backdrop-blur-md px-6 py-3 text-sm font-medium text-white transition-transform duration-500 group-hover:scale-105">
                                Explorar Diseño
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="text-xl font-light">{design.title}</h3>
                            <span className="font-mono text-[10px] opacity-40">{design.year}</span>
                          </div>
                          <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
                            Categoría {activeCategory?.title}
                          </p>
                        </div>
                      </>
                    )

                    return (
                      <motion.div
                        key={design.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group"
                      >
                        {hasLink ? (
                          <a href={design.html_path} target="_blank" rel="noopener noreferrer" className="block focus:outline-none">
                            {content}
                          </a>
                        ) : (
                          <div className="block cursor-default">{content}</div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
