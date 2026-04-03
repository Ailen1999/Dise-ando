"use client"

import { MagneticButton } from "@/components/magnetic-button"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function CatalogNav() {
  const pathname = usePathname()

  const navItems = [
    { name: "Inicio", href: "/" },
    { name: "Proyectos", href: "/projects" },
    { name: "Diseños", href: "/designs" },
  ]

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-6 transition-opacity duration-700 md:px-12 opacity-100">
      <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
        <span
          className="logo-shimmer"
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "2.2rem",
            fontWeight: 700,
            fontStyle: "italic",
            letterSpacing: "0.05em",
            lineHeight: 1,
          }}
        >
          STUDIO 99
        </span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative font-sans text-sm font-medium transition-colors ${
                isActive ? "text-foreground" : "text-foreground/80 hover:text-foreground"
              }`}
            >
              {item.name}
              <span
                className={`absolute -bottom-1 left-0 h-px bg-foreground transition-all duration-300 ${
                  isActive ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          )
        })}
      </div>

      <MagneticButton variant="secondary" onClick={() => (window.location.href = "/")}>
        Volver
      </MagneticButton>
    </nav>
  )
}
