"use client"

import { Mail, MapPin } from "lucide-react"
import { useReveal } from "@/hooks/use-reveal"
import { useState, type FormEvent } from "react"
import { MagneticButton } from "@/components/magnetic-button"

export function ContactSection() {
  const { ref, isVisible } = useReveal(0.3)
  const [formData, setFormData] = useState({ name: "", email: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setSubmitSuccess(true)
    setFormData({ name: "", email: "", message: "" })
    setTimeout(() => setSubmitSuccess(false), 5000)
  }

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start flex-col justify-center px-6 pt-20 pb-8 md:px-12 lg:px-16"
    >
      <div className="mx-auto w-full max-w-4xl flex flex-col h-full justify-center gap-10 md:gap-14">

        {/* Header */}
        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-4xl font-light leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Hablemos sobre tu proyecto
          </h2>
          <p className="font-mono text-xs text-foreground/60 uppercase tracking-widest md:text-sm">
            Contame tu idea y la transformamos en una experiencia web profesional.
          </p>
        </div>

        {/* Form — full width, 3 columns on desktop */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div
              className={`transition-all duration-700 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "150ms" }}
            >
              <label className="mb-2 block font-mono text-xs text-foreground/60 uppercase tracking-widest">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full border-b border-foreground/30 bg-transparent py-2 text-base text-foreground placeholder:text-foreground/40 focus:border-foreground/60 focus:outline-none md:text-lg"
                placeholder="Tu nombre"
              />
            </div>

            <div
              className={`transition-all duration-700 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "250ms" }}
            >
              <label className="mb-2 block font-mono text-xs text-foreground/60 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full border-b border-foreground/30 bg-transparent py-2 text-base text-foreground placeholder:text-foreground/40 focus:border-foreground/60 focus:outline-none md:text-lg"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div
            className={`transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "350ms" }}
          >
            <label className="mb-2 block font-mono text-xs text-foreground/60 uppercase tracking-widest">Mensaje</label>
            <textarea
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              className="w-full border-b border-foreground/30 bg-transparent py-2 text-base text-foreground placeholder:text-foreground/40 focus:border-foreground/60 focus:outline-none md:text-lg"
              placeholder="Contame sobre tu proyecto..."
            />
          </div>

          <div
            className={`pt-2 transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "450ms" }}
          >
            <MagneticButton
              variant="primary"
              size="lg"
              className="w-full disabled:opacity-50"
            >
              {isSubmitting ? "Enviando..." : "Enviar mensaje"}
            </MagneticButton>
            {submitSuccess && (
              <p className="mt-3 text-center font-mono text-sm text-foreground/80">¡Mensaje enviado correctamente!</p>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
