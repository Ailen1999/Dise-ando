"use client"

import { useReveal } from "@/hooks/use-reveal"
import Link from "next/link"

export function WorkSection() {
  const { ref, isVisible } = useReveal(0.3)

  return (
    <section
      ref={ref}
      className="relative flex h-screen w-screen shrink-0 snap-start flex-col overflow-hidden font-sans text-white px-6 pt-20 md:pt-24 md:px-12 lg:px-24"
    >
      <div className="flex w-full max-w-[1400px] mx-auto h-full flex-col justify-center gap-4 md:gap-6 pb-6 md:pb-8">

        {/* Intro Section */}
        <div
          className={`flex flex-col gap-2 md:gap-3 transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter leading-none opacity-90">
            Proyectos destacados
          </h2>
          <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-60 max-w-lg">
            Algunos de los sitios web y experiencias digitales que desarrollamos recientemente.
          </p>
        </div>

        {/* Projects Grid Container */}
        <div className="flex w-full gap-4 sm:gap-6 md:gap-12 lg:gap-16 flex-1 min-h-0 items-end">

          {/* Project 1 */}
          <article
            className={`flex-1 group transition-all duration-1000 delay-200 flex flex-col justify-start min-w-0 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
            }`}
          >
            <Link href="/projects" className="relative block overflow-hidden rounded-lg w-full h-[28vh] sm:h-[35vh] md:h-[42vh] lg:h-[52vh] group-hover:cursor-none">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuApXgJ9rEvD6h6cuVkMe6QaIC3W7I4MQbQfJiIkKfnelHjvBLkldRRSDlSNLtxfFJ0rx_OwBZgwah11kdLfdFEVjrUT5SBn9f9aSpNM4vwAKBwZMWMt9JS2qE1JtmKswqXMK5vlP9kfsmk6Z8fefuDBtEeB5ESwkCgGAZwf1V4j68EB9GoRo3UvhBrcVEv_p1PZZZdRJh_nlx5HkY4Wz65FcbEyb7dlV2YuDpKnQu6cVuH3jl8tYJQpxZCDn5HJri8k0-Pp8uW3HhXi"
                alt="Proyectos"
                className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="rounded-full border border-white px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-white transition-transform duration-500 group-hover:scale-105">Ver proyectos</span>
              </div>
            </Link>
            <div className="mt-3 md:mt-4 lg:mt-6 flex flex-col w-full">
              <div className="flex w-full justify-between items-start">
                <span className="mb-1 block font-mono text-xs opacity-50">01</span>
                <span className="font-mono text-xs opacity-50">2026</span>
              </div>
              <h3 className="mb-1 text-lg md:text-2xl lg:text-3xl font-light">Nuestros proyectos</h3>
              <p className="font-mono text-[10px] md:text-xs uppercase tracking-widest opacity-60">Experiencia Interactiva</p>
              <div className="w-full border-b border-white/10 mt-4 md:mt-6 lg:mt-8"></div>
            </div>
          </article>

          {/* Project 2 */}
          <article
            className={`flex-1 group transition-all duration-1000 delay-500 flex flex-col justify-end min-w-0 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
            }`}
          >
            <Link href="/designs" className="relative block overflow-hidden rounded-lg w-full h-[28vh] sm:h-[35vh] md:h-[42vh] lg:h-[52vh] group-hover:cursor-none">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKCXpVBaWQBLLTmhJXPyxXPNkUOlepa89eoItnK9gj7kF7XRibUhOjzAenREmtZUNmaBlcLxBpWt4pszhsRI0-1PM8NHRunH0jQGw5UuVCSoMbgtXhct6JauAYnh9tDulJSCuLZUu9ItxHdzAn7cWC2F94fzKJS_iyWu7_A09cgRR92yMuXHP32C9jeiq8Y5DrzPWr6ojZgtnRJRdkmaHlamUXaWizsvRboDc1zYzsUgkJuI4Cn2eDZH_dwm7eBzO7Kewf9CyLIeyo"
                alt="Generative Patterns project"
                className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="rounded-full border border-white px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-white transition-transform duration-500 group-hover:scale-105">Ver diseños</span>
              </div>
            </Link>
            <div className="mt-3 md:mt-4 lg:mt-6 flex flex-col w-full">
              <div className="flex w-full justify-between items-start">
                <span className="mb-1 block font-mono text-xs opacity-50">02</span>
                <span className="font-mono text-xs opacity-50">2026</span>
              </div>
              <h3 className="mb-1 text-lg md:text-2xl lg:text-3xl font-light">Diseños personalizados</h3>
              <p className="font-mono text-[10px] md:text-xs uppercase tracking-widest opacity-60">Sistema Visual</p>
              <div className="w-full border-b border-white/10 mt-4 md:mt-6 lg:mt-8"></div>
            </div>
          </article>

        </div>
      </div>
    </section>
  )
}
