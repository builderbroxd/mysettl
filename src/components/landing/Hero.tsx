import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { Appear, Btn, BtnArrow, EASE_APPEAR, Num, formatAmount } from "./ui"

// Example invoice: 10,000 sUSD, Tier A advance (90% at 8% APR), due in 30 days.
// The split follows AdvanceEngine and SettlementRouter to the cent.
const EXAMPLE = { amount: 10_000, advance: 9_000, fee: 50, repay: 9_059.18, seller: 890.82 }

const PHASES = [
  { label: "Issued", tone: "sky", note: "The invoice is recorded on-chain and the seller has a link to send." },
  { label: "Financed", tone: "amber", note: `The seller draws ${formatAmount(EXAMPLE.advance)} sUSD from the funding pool before the buyer pays.` },
  { label: "Paid", tone: "lilac", note: `The buyer pays ${formatAmount(EXAMPLE.amount)} sUSD through the link.` },
  { label: "Cleared", tone: "green", note: "The same transaction paid the fee, repaid the pool and sent the seller the rest." },
]

const ROWS = [
  { label: "Protocol fee", value: EXAMPLE.fee, color: "var(--coral)" },
  { label: "Pool repayment", value: EXAMPLE.repay, color: "var(--violet)" },
  { label: "Seller payout", value: EXAMPLE.seller, color: "var(--green)" },
]

const HEADLINE = [
  [{ text: "Send" }, { text: "an" }, { text: "invoice." }],
  [{ text: "Get" }, { text: "paid" }, { text: "in" }, { text: "one transaction.", mark: true }],
]

function Headline() {
  const reduce = useReducedMotion()
  let index = 0
  return (
    <h1 className="st-h1" aria-label="Send an invoice. Get paid in one transaction.">
      {HEADLINE.map((line, l) => (
        <span key={l} aria-hidden="true" style={{ display: "block" }}>
          {line.map((token) => {
            const i = index++
            return (
              <span key={token.text}>
                <motion.span
                  className="st-word"
                  initial={reduce ? false : { opacity: 0, y: 32, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ type: "tween", ease: EASE_APPEAR, duration: 1, delay: 0.1 + i * 0.08 }}
                >
                  {token.mark ? <span className="st-mark">{token.text}</span> : token.text}
                </motion.span>{" "}
              </span>
            )
          })}
        </span>
      ))}
    </h1>
  )
}

function Sticker({
  show,
  className,
  label,
  value,
  rotate,
}: {
  show: boolean
  className: string
  label: string
  value: string
  rotate: number
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`st-sticker ${className}`}
          initial={{ opacity: 0, scale: 0.6, rotate: rotate * 3 }}
          animate={{ opacity: 1, scale: 1, rotate }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          {label}
          <b className="st-num">{value}</b>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ProductPanel() {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState(reduce ? 3 : 0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 3000)
    return () => clearInterval(id)
  }, [reduce])

  const settled = phase >= 2

  return (
    <motion.div
      className="st-shot-wrap"
      initial={reduce ? false : { opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", ease: EASE_APPEAR, duration: 1.4, delay: 0.6 }}
    >
      <Sticker show={phase >= 1} className="st-sticker-a" label="Advance sent to seller" value={`+${formatAmount(EXAMPLE.advance)}`} rotate={-6} />
      <Sticker show={phase === 3} className="st-sticker-b" label="Seller paid out" value={`+${formatAmount(EXAMPLE.seller)}`} rotate={5} />
      <Sticker show={phase === 3} className="st-sticker-c" label="Pool repaid" value={formatAmount(EXAMPLE.repay)} rotate={-3} />

      <div className="st-shot">
        <div className="st-shot-bar">
          <div className="st-shot-crumb">
            <span className="st-shot-dots st-hide-m" aria-hidden>
              <i style={{ background: "var(--coral)" }} />
              <i style={{ background: "var(--amber)" }} />
              <i style={{ background: "var(--lime)" }} />
            </span>
            <span className="st-hide-m">Invoices /</span> <b>INV-1042</b>
            <span className="st-badge">Example</span>
          </div>
          <span className="st-badge" data-tone={PHASES[phase].tone}>
            {PHASES[phase].label}
          </span>
        </div>

        <div className="st-shot-body">
          <div className="st-shot-main">
            <div className="st-shot-label">Amount due</div>
            <div className="st-shot-amount st-num">
              {formatAmount(EXAMPLE.amount)}
              <small>sUSD</small>
            </div>

            <div className="st-shot-meta">
              <div>
                <span className="st-shot-label">Seller</span>
                <b>BlueWave Exports</b>
              </div>
              <div>
                <span className="st-shot-label">Buyer</span>
                <b>Meridian Retail</b>
              </div>
              <div>
                <span className="st-shot-label">Due</span>
                <b>In 30 days</b>
              </div>
            </div>

            <div className="st-rail">
              <div className="st-rail-line">
                <motion.div
                  className="st-rail-fill"
                  animate={{ scaleX: phase / (PHASES.length - 1) }}
                  transition={{ type: "tween", ease: EASE_APPEAR, duration: 0.9 }}
                />
              </div>
              <div className="st-rail-steps">
                {PHASES.map((p, i) => (
                  <div key={p.label} className="st-rail-step" data-on={i <= phase} data-now={i === phase}>
                    <i />
                    {p.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="st-shot-side">
            <div className="st-shot-label" style={{ marginBottom: 6 }}>
              Settlement
            </div>
            {ROWS.map((row, i) => (
              <div key={row.label} className="st-split-row">
                <div className="st-split-top">
                  {row.label}
                  <b>
                    <Num value={settled ? row.value : 0} />
                  </b>
                </div>
                <div className="st-split-bar">
                  <motion.i
                    style={{ background: row.color }}
                    animate={{ scaleX: settled ? Math.max(row.value / EXAMPLE.amount, 0.03) : 0 }}
                    transition={{ type: "tween", ease: EASE_APPEAR, duration: 0.9, delay: settled ? i * 0.1 : 0 }}
                  />
                </div>
              </div>
            ))}
            <p className="st-shot-note">{PHASES[phase].note}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%" aria-hidden>
      <path d="M12 0c.9 6.6 4.5 10.2 12 12-7.5 1.8-11.1 5.4-12 12-.9-6.6-4.5-10.2-12-12C7.5 10.2 11.1 6.600 12 0Z" />
    </svg>
  )
}

export function Hero() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const drift = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160])
  const driftSlow = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90])
  const spin = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120])

  return (
    <header className="st-block-wrap st-hero-wrap" id="top">
      <div className="st-block st-block-forest st-hero" ref={ref}>
        <div className="st-deco st-rings" aria-hidden />
        <motion.div className="st-deco st-shape-lime" style={{ y: drift }} aria-hidden />
        <motion.div className="st-deco st-shape-coral" style={{ y: driftSlow, rotate: -18 }} aria-hidden />
        <motion.div className="st-deco st-shape-amber" style={{ rotate: spin }} aria-hidden>
          <Star />
        </motion.div>
        <motion.div className="st-deco st-shape-lilac" style={{ y: drift, rotate: 16 }} aria-hidden />

        <div className="st-container">
          <div className="st-hero-top">
            <Appear>
              <span className="st-pretitle st-pretitle-dark" style={{ ["--dot" as string]: "var(--lime)" }}>
                Invoice payments on QDay Aevum testnet
              </span>
            </Appear>
            <Headline />
            <Appear delay={0.5}>
              <p className="st-hero-sub st-body" style={{ color: "rgba(246,241,231,0.76)" }}>
                SETTL. turns an invoice into a payment link. When the buyer pays in sUSD, the contract takes the fee,
                repays any advance and sends the seller the rest.
              </p>
            </Appear>
            <Appear delay={0.6} className="st-buttons">
              <BtnArrow to="/app/invoices/new">Create an invoice</BtnArrow>
              <Btn variant="ghost" href="#how">
                See how it works
              </Btn>
            </Appear>
            <Appear delay={0.7} className="st-hero-list">
              <span className="st-chip">
                <i style={{ background: "var(--coral)" }} />
                <b>0.5%</b> protocol fee
              </span>
              <span className="st-chip">
                <i style={{ background: "var(--amber)" }} />
                Advances up to <b>90%</b>
              </span>
              <span className="st-chip">
                <i style={{ background: "var(--lime)" }} />
                Settles in <b>sUSD</b>
              </span>
            </Appear>
          </div>
          <ProductPanel />
        </div>
      </div>
    </header>
  )
}
