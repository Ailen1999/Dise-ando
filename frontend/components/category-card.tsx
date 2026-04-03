"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

interface CategoryCardProps {
  title: string
  category: string
  image: string
  count: number
  className?: string
  onClick: () => void
}

export function CategoryCard({ title, category, image, count, className, onClick }: CategoryCardProps) {
  return (
    <motion.div
      layoutId={`card-${category}`}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-foreground/5 transition-all hover:cursor-pointer ${className}`}
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-white/5">
        {image ? (
          <img
            src={image}
            alt={title}
            suppressHydrationWarning
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-white/5 to-white/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 p-6 text-white md:p-8">
        <motion.p 
          className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-white/60"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {category}
        </motion.p>
        <motion.h3 
          className="text-2xl font-light md:text-3xl"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {title}
        </motion.h3>
        <motion.div 
          className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white/100 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span>{count} Proyectos</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </motion.div>
      </div>

      <div className="absolute right-6 top-6 h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-all group-hover:border-white/40 group-hover:bg-white/20">
         {/* Subtle icon or badge could go here */}
      </div>
    </motion.div>
  )
}
