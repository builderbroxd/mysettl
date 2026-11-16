import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from "framer-motion"
import { ArrowRight, Check, Copy } from "lucide-react"

export const EASE_APPEAR: [number, number, number, number] = [0.12, 0.23, 0.5, 1]

export function formatAmount(value: number, decimals = 2) {
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** Rise and fade in once, when scrolled into view. */
export function Appear({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className} style={style}>{children}</div>
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ type: "tween", ease: EASE_APPEAR, duration: 1, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Headline that arrives one word at a time. */
export function WordReveal({
  text,
  className,
  delay = 0,
  breakAfter,
}: {
  text: string
  className?: string
  delay?: number
  /** Index of the word to force a line break after. */
  breakAfter?: number
}) {
  const reduce = useReducedMotion()
  const words = text.split(" ")
  return (
    <h1 className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true">
          <motion.span
            className="st-word"
            initial={reduce ? false : { opacity: 0, y: 32, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "tween", ease: EASE_APPEAR, duration: 1, delay: delay + i * 0.07 }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
          {breakAfter === i ? <br /> : null}
        </span>
      ))}
    </h1>
  )
}

/** A number that eases to its new value instead of jumping. */
export function Num({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const target = useMotionValue(value)
  const spring = useSpring(target, { stiffness: 110, damping: 22, mass: 0.6 })

  useEffect(() => {
    target.set(value)
  }, [value, target])

  useEffect(() => {
    if (ref.current) ref.current.textContent = formatAmount(spring.get(), decimals)
  }, [spring, decimals])

  useMotionValueEvent(spring, "change", (v) => {
    if (ref.current) ref.current.textContent = formatAmount(v, decimals)
  })

  return <span ref={ref} className="st-num" />
}

type Target = { to?: string; href?: string; external?: boolean }

function Clickable({ to, href, external, className, children }: Target & { className: string; children: ReactNode }) {
  if (to) return <Link to={to} className={className}>{children}</Link>
  return (
    <a href={href} className={className} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
      {children}
    </a>
  )
}

/** Primary button: dark pill with an arrow disc that turns on hover. */
export function BtnArrow({
  children,
  variant = "default",
  ...target
}: Target & { children: ReactNode; variant?: "default" | "sm" | "light" }) {
  return (
    <Clickable {...target} className={`st-btnic${variant === "default" ? "" : ` st-btnic-${variant}`}`}>
      <span className="st-btnic-in">
        <span>{children}</span>
        <span className="st-btnic-ic" aria-hidden>
          <ArrowRight size={variant === "sm" ? 11 : 14} strokeWidth={2.5} />
        </span>
      </span>
    </Clickable>
  )
}

export function Btn({ children, variant, ...target }: Target & { children: ReactNode; variant?: "ghost" | "line" }) {
  return (
    <Clickable {...target} className={`st-btn${variant ? ` st-btn-${variant}` : ""}`}>
      {children}
    </Clickable>
  )
}

export function SectionHead({
  pretitle,
  title,
  lead,
  left,
  dot = "var(--coral)",
}: {
  pretitle: string
  title: string
  lead?: string
  left?: boolean
  /** Colour of the small diamond in the pre-title pill. */
  dot?: string
}) {
  return (
    <Appear className={`st-head${left ? " st-head-left" : ""}`}>
      <span className="st-pretitle" style={{ ["--dot" as string]: dot }}>{pretitle}</span>
      <h2 className="st-h2">{title}</h2>
      {lead && <p className="st-body">{lead}</p>}
    </Appear>
  )
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="st-copy"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        } catch {
          // Clipboard can be blocked (insecure context); the value stays selectable on screen.
        }
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}
