"use client"

import { useReveal } from "@/hooks/use-reveal"

export function ServicesSection() {
  const { ref, isVisible } = useReveal(0.3)

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start flex-col justify-center px-6 pt-20 pb-8 md:px-12 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl flex flex-col h-full justify-center gap-10 md:gap-14">
        {/* Header */}
        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-4xl font-light tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Servicios
          </h2>
          <p className="font-mono text-xs text-foreground/60 uppercase tracking-widest md:text-sm">
            Lo que podemos desarrollar para tu proyecto
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-20 md:gap-y-10 lg:gap-x-32">
          {[
            {
              title: "Desarrollo Web",
              description: "Desarrollo sitios web modernos utilizando tecnologías actuales, optimizados para velocidad, rendimiento y adaptabilidad a cualquier dispositivo.",
              direction: "top",
            },
            {
              title: "Diseño de Interfaces",
              description: "Diseño interfaces limpias y modernas centradas en la experiencia del usuario, la accesibilidad y la claridad visual.",
              direction: "right",
            },
            {
              title: "Animaciones e Interacciones",
              description: "Incorporo animaciones y microinteracciones que hacen que la experiencia del usuario sea más dinámica y atractiva.",
              direction: "left",
            },
            {
              title: "Estrategia Técnica",
              description: "Te ayudo a elegir la mejor estructura y tecnologías para construir un sitio web escalable, rápido y eficiente.",
              direction: "bottom",
            },
          ].map((service, i) => (
            <ServiceCard key={i} service={service} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceCard({
  service,
  index,
  isVisible,
}: {
  service: { title: string; description: string; direction: string }
  index: number
  isVisible: boolean
}) {
  const getRevealClass = () => {
    if (!isVisible) {
      switch (service.direction) {
        case "left":
          return "-translate-x-16 opacity-0"
        case "right":
          return "translate-x-16 opacity-0"
        case "top":
          return "-translate-y-16 opacity-0"
        case "bottom":
          return "translate-y-16 opacity-0"
        default:
          return "translate-y-12 opacity-0"
      }
    }
    return "translate-x-0 translate-y-0 opacity-100"
  }

  return (
    <div
      className={`group transition-all duration-700 border-t border-foreground/15 pt-6 ${getRevealClass()}`}
      style={{
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px w-8 bg-foreground/30 transition-all duration-300 group-hover:w-12 group-hover:bg-foreground/50" />
        <span className="font-mono text-xs text-foreground/50">0{index + 1}</span>
      </div>
      <h3 className="mb-2 font-sans text-xl font-light text-foreground md:text-2xl lg:text-3xl">{service.title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-foreground/75 md:text-base">{service.description}</p>
    </div>
  )
}
