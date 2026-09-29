"use client";
import { motion } from "motion/react";

/** Fait apparaître son contenu au défilement (une seule fois). Respecte "mouvement réduit" via MotionConfig global. */
export default function Reveal({ as = "div", delay = 0, style, className, children }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      style={style}
      data-reveal=""
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </Comp>
  );
}
