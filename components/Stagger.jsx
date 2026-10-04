"use client";
import { motion } from "motion/react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/** Conteneur qui fait apparaître ses enfants <StaggerItem> l'un après l'autre, au défilement ou au montage. */
export function StaggerGroup({ as = "div", onView = true, className, style, children }) {
  const Comp = motion[as] || motion.div;
  const viewProps = onView
    ? { whileInView: "show", viewport: { once: true, margin: "-60px" } }
    : { animate: "show" };
  return (
    <Comp className={className} style={style} variants={container} initial="hidden" data-reveal="" {...viewProps}>
      {children}
    </Comp>
  );
}

export function StaggerItem({ as = "div", className, style, children, ...rest }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp className={className} style={style} variants={item} data-reveal="" {...rest}>
      {children}
    </Comp>
  );
}
