"use client"

import { useEffect, useState } from "react"
import { WebglBackground } from "@/components/webgl-background"
import { CatalogNav } from "@/components/catalog-nav"
import { CustomCursor } from "@/components/custom-cursor"
import { getProjects, type Project } from "@/lib/api"

export default function ProjectsCatalog() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="relative min-h-screen w-full bg-background font-sans text-white">
      <WebglBackground />
      <CustomCursor />
      <CatalogNav />
      
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-8 pt-40 pb-20 lg:px-24">
        {/* Header Title */}
        <div className="mb-16 md:mb-24">
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-light tracking-tighter leading-none opacity-90 mb-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Proyectos
          </h1>
          <p className="ml-2 font-mono text-xs md:text-sm uppercase tracking-[0.3em] opacity-60 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            / Experiencias Interactivas
          </p>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-y-24">
            {projects.map((project, index) => (
              <article 
                key={project.id}
                className={`group animate-in fade-in slide-in-from-bottom-12 duration-1000 ${
                  index % 2 !== 0 ? "md:mt-32" : ""
                }`}
                style={{ animationDelay: `${index * 200 + 400}ms` }}
              >
                {project.external_url ? (
                  <a href={project.external_url} target="_blank" rel="noopener noreferrer" className="relative block overflow-hidden rounded-lg aspect-[4/3] w-full">
                    <img 
                      src={project.image_url}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <span className="rounded-full border border-white px-6 py-3 text-sm font-medium text-white transition-transform duration-500 group-hover:scale-105">View Live Site</span>
                    </div>
                  </a>
                ) : (
                  <div className="relative block overflow-hidden rounded-lg aspect-[4/3] w-full cursor-not-allowed">
                    <img 
                      src={project.image_url}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <span className="rounded-full border border-white px-6 py-3 text-sm font-medium text-white transition-transform duration-500 group-hover:scale-105">View Case Study</span>
                    </div>
                  </div>
                )}
                <div className="mt-6 flex flex-col h-full w-full relative">
                  <div className="flex w-full justify-between items-start">
                      <span className="mb-2 block font-mono text-xs opacity-50">{String((index + 1)).padStart(2, '0')}</span>
                      <span className="mt-1 font-mono text-xs opacity-50">2024</span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="mb-1 text-2xl lg:text-3xl font-light">{project.title}</h3>
                    <p className="font-mono text-xs uppercase tracking-widest opacity-60">{project.description}</p>
                  </div>
                  <div className="w-full border-b border-white/10 mt-6 lg:mt-8"></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
