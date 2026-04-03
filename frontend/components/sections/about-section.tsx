"use client"

import { useReveal } from "@/hooks/use-reveal"

export function AboutSection({ scrollToSection }: { scrollToSection?: (index: number) => void }) {
  const { ref, isVisible } = useReveal(0.3)

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start flex-col justify-center px-6 pt-20 pb-8 md:px-12 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl flex flex-col h-full justify-center gap-10 md:gap-16">

        {/* Header */}
        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="font-sans text-4xl font-light leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Construyendo experiencias
            <br />
            digitales modernas
          </h2>
        </div>

        {/* Bottom grid: text + stats */}
        <div className="grid gap-10 md:grid-cols-2 md:gap-16 lg:gap-24">

          {/* Left - Paragraphs */}
          <div
            className={`space-y-4 transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <p className="text-base leading-relaxed text-foreground/80 md:text-lg">
              Somos un equipo especializado en crear sitios web modernos y eficientes. Combinamos diseño y desarrollo para construir experiencias digitales que funcionan perfectamente en cualquier dispositivo.
            </p>
            <p className="text-base leading-relaxed text-foreground/80 md:text-lg">
              Cada proyecto es una oportunidad para crear algo único, enfocado en el rendimiento y la mejor experiencia de usuario.
            </p>
          </div>

          {/* Right - Stats */}
          <div className="flex flex-col justify-center space-y-6 md:space-y-8">
            {[
              { value: "10+", label: "Proyectos", sublabel: "desarrollados", direction: "right" },
              { value: "+5", label: "Años de experiencia", sublabel: "en desarrollo web", direction: "left" },
              { value: "100%", label: "Enfoque", sublabel: "en calidad y rendimiento", direction: "right" },
            ].map((stat, i) => {
              const getRevealClass = () => {
                if (!isVisible) {
                  return stat.direction === "left" ? "-translate-x-16 opacity-0" : "translate-x-16 opacity-0"
                }
                return "translate-x-0 opacity-100"
              }

              return (
                <div
                  key={i}
                  className={`flex items-baseline gap-4 border-l border-foreground/30 pl-5 transition-all duration-700 md:gap-6 md:pl-8 ${getRevealClass()}`}
                  style={{
                    transitionDelay: `${300 + i * 150}ms`,
                    marginLeft: i % 2 === 0 ? "0" : "auto",
                    maxWidth: i % 2 === 0 ? "100%" : "85%",
                  }}
                >
                  <div className="text-3xl font-light text-foreground md:text-5xl lg:text-6xl">{stat.value}</div>
                  <div>
                    <div className="font-sans text-base font-light text-foreground md:text-xl">{stat.label}</div>
                    <div className="font-mono text-xs text-foreground/60 uppercase tracking-widest">{stat.sublabel}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
