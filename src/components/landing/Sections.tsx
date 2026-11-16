import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Check, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { aevumTestnet, EXPLORER_URL, FAUCET_URL } from "@/lib/chain"
import { contractAddresses } from "@/lib/contracts"
import { Appear, CopyButton, EASE_APPEAR, Num, SectionHead, formatAmount, shortAddress } from "./ui"

/* ---------- Before / after ---------- */
const SIDES = {
  before: {
    title: "Getting paid on an invoice today",
    icon: "x",
    points: [
      "You send a PDF and wait out the payment terms.",
      "A lender advances cash, then you forward the buyer's payment yourself.",
      "Fees and repayments are reconciled by hand afterwards.",
      "Your payment record stays with that one lender.",
    ],
    stats: [
      ["3 steps", "Collect, repay the lender, reconcile"],
      ["By hand", "How the money gets split"],
    ],
  },
  after: {
    title: "The same invoice on SETTL.",
    icon: "chevron",
    points: [
      "You send a link and the buyer pays in sUSD.",
      "The pool is repaid out of the buyer's payment.",
      "Fee, repayment and payout are split by the contract.",
      "Each cleared invoice adds to a score anyone can read.",
    ],
    stats: [
      ["1 transaction", "Pays the fee, the pool and the seller"],
      ["0.5%", "Protocol fee on a settled invoice"],
    ],
  },
} as const

type Side = keyof typeof SIDES

export function Compare() {
  const [side, setSide] = useState<Side>("before")
  const ref = useRef<HTMLDivElement>(null)

  // Flip to "after" the first time the panel is properly on screen.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSide("after")
          io.disconnect()
        }
      },
      { threshold: 0.75 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const current = SIDES[side]

  return (
    <section className="st-sec">
      <div className="st-container">
        <SectionHead pretitle="Why SETTL." dot="var(--coral)" title="One payment should be enough to close an invoice" />
        <Appear>
          <div data-side={side} className="st-ba">
            <div className="st-ba-tabs" role="tablist" aria-label="Compare">
              <motion.span
                className="st-ba-thumb"
                animate={{ x: side === "before" ? 0 : "100%" }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                aria-hidden
              />
              {(["before", "after"] as Side[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  className="st-ba-tab"
                  aria-selected={side === s}
                  onClick={() => setSide(s)}
                >
                  {s === "before" ? "Without SETTL." : "With SETTL."}
                </button>
              ))}
            </div>
            <div className="st-ba-frame" ref={ref}>
              <div className="st-ba-panel">
                <div>
                  <h3 className="st-h3" style={{ fontSize: 30, letterSpacing: -0.9 }}>
                    {current.title}
                  </h3>
                  <div className="st-ba-list">
                    {current.points.map((point) => (
                      <div key={point} className="st-ba-li">
                        <i>
                          {current.icon === "x" ? <X size={14} strokeWidth={3} /> : <Check size={14} strokeWidth={3} />}
                        </i>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="st-ba-stats">
                  {current.stats.map(([value, label]) => (
                    <div key={value} className="st-ba-stat">
                      <b>{value}</b>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Appear>
      </div>
    </section>
  )
}

/* ---------- How it works ---------- */
const STEPS = [
  {
    title: "Create the invoice",
    body: "Enter the buyer, the amount and the due date. The invoice is recorded on-chain and minted to you as a token.",
    call: "createInvoice()",
    tone: "var(--lime)",
    tilt: "-1.2deg",
  },
  {
    title: "Take an advance if you need one",
    body: "Draw part of the invoice from the funding pool before the buyer pays. Your tier sets the limit: 35%, 65% or 90%.",
    call: "requestAdvance()",
    tone: "var(--amber)",
    tilt: "1deg",
  },
  {
    title: "The buyer pays once",
    body: "The buyer opens your link and pays the full amount in sUSD. Only the buyer named on the invoice can pay it.",
    call: "payInvoice()",
    tone: "var(--lilac)",
    tilt: "-1deg",
  },
  {
    title: "The contract splits it",
    body: "In that same transaction the fee is taken, the pool is repaid with interest, you receive the rest and your score goes up.",
    call: "InvoiceSettled",
    tone: "var(--coral)",
    tilt: "1.2deg",
  },
]

export function Steps() {
  return (
    <section className="st-sec" id="how">
      <div className="st-container">
        <SectionHead
          pretitle="How it works"
          dot="var(--violet)"
          title="Four steps, and the contract does the last one"
          lead="Each step is a contract call you can look up in the explorer."
        />
        <div className="st-steps">
          {STEPS.map((step, i) => (
            <Appear key={step.title} delay={i * 0.1}>
              <div className="st-step" style={{ ["--tone" as string]: step.tone, ["--tilt" as string]: step.tilt }}>
                <span className="st-step-n">0{i + 1}</span>
                <h3 className="st-h3" style={{ fontSize: 21 }}>
                  {step.title}
                </h3>
                <p className="st-sm">{step.body}</p>
                <code>{step.call}</code>
              </div>
            </Appear>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Calculator ---------- */
type Tier = "none" | "C" | "B" | "A"

// LTV per tier is what the app offers; APR is the top of each tier's range.
const TIERS: Record<Tier, { label: string; ltvBps: number; aprBps: number }> = {
  none: { label: "No advance", ltvBps: 0, aprBps: 0 },
  C: { label: "Tier C", ltvBps: 3500, aprBps: 1800 },
  B: { label: "Tier B", ltvBps: 6500, aprBps: 1200 },
  A: { label: "Tier A", ltvBps: 9000, aprBps: 800 },
}

const FEE_BPS = 50
const UNIT = 1_000_000 // sUSD has 6 decimals

/** Same integer math as AdvanceEngine.requestAdvance and SettlementRouter.payInvoice. */
function settle(amount: number, tier: Tier, days: number) {
  const total = amount * UNIT
  const { ltvBps, aprBps } = TIERS[tier]
  const fee = Math.floor((total * FEE_BPS) / 10_000)
  const advance = Math.floor((total * ltvBps) / 10_000)
  const interest = Math.floor((advance * aprBps * days) / (10_000 * 365))
  const repay = advance + interest
  return {
    fee: fee / UNIT,
    advance: advance / UNIT,
    interest: interest / UNIT,
    repay: repay / UNIT,
    seller: (total - fee - repay) / UNIT,
  }
}

export function Calculator() {
  const [amount, setAmount] = useState(10_000)
  const [tier, setTier] = useState<Tier>("A")
  const [days, setDays] = useState(30)
  const r = useMemo(() => settle(amount, tier, days), [amount, tier, days])

  const rows = [
    { label: "Protocol fee", value: r.fee, color: "var(--coral)" },
    { label: "Pool repayment", value: r.repay, color: "var(--violet)" },
    { label: "Seller payout", value: r.seller, color: "var(--green)" },
  ]

  return (
    <section className="st-block-wrap" id="calculator" style={{ scrollMarginTop: 20 }}>
      <div className="st-block st-block-forest st-calc-block st-on-dark">
        <div className="st-deco st-rings" style={{ top: -700 }} aria-hidden />
        <div className="st-container">
          <SectionHead
            pretitle="Settlement calculator"
            dot="var(--lime)"
            title="See where the buyer's payment goes"
            lead="Set up an invoice and read the split. It uses the same arithmetic as the contracts."
          />
          <Appear className="st-calc">
            <div className="st-card st-card-glass">
              <label className="st-field">
                <span className="st-field-top">
                  Invoice amount <b className="st-num">{formatAmount(amount, 0)} sUSD</b>
                </span>
                <input
                  type="range"
                  min={1000}
                  max={100000}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </label>
              <label className="st-field">
                <span className="st-field-top">
                  Days until due <b className="st-num">{days}</b>
                </span>
                <input type="range" min={7} max={90} value={days} onChange={(e) => setDays(Number(e.target.value))} />
              </label>
              <div className="st-tiers">
                <span className="st-field-top">Advance</span>
                <div className="st-tier-grid">
                  {(Object.keys(TIERS) as Tier[]).map((t) => (
                    <button key={t} type="button" className="st-tier" aria-pressed={tier === t} onClick={() => setTier(t)}>
                      <b>{TIERS[t].label}</b>
                      <span>
                        {t === "none" ? "Paid in full later" : `${TIERS[t].ltvBps / 100}% at ${TIERS[t].aprBps / 100}% APR`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="st-card" style={{ border: "none" }}>
              <div className="st-xs">Buyer pays</div>
              <div className="st-calc-total">
                <Num value={amount} />
                <small>sUSD</small>
              </div>

              <div className="st-stack" aria-hidden>
                {rows.map((row) => (
                  <motion.i
                    key={row.label}
                    style={{ background: row.color }}
                    animate={{ flexGrow: row.value, flexBasis: 0, opacity: row.value > 0 ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 140, damping: 24 }}
                  />
                ))}
              </div>

              <div className="st-calc-rows">
                {rows.map((row) => (
                  <div key={row.label} className="st-calc-row">
                    <i style={{ background: row.color }} />
                    <span>{row.label}</span>
                    <em className="st-num">{formatAmount((row.value / amount) * 100)}%</em>
                    <b>
                      <Num value={row.value} />
                    </b>
                  </div>
                ))}
              </div>

              <div className="st-calc-foot">
                <span>
                  Advance received up front
                  <b>
                    <Num value={r.advance} />
                  </b>
                </span>
                <span>
                  Interest to the due date
                  <b>
                    <Num value={r.interest} />
                  </b>
                </span>
              </div>
            </div>
          </Appear>
        </div>
      </div>
    </section>
  )
}

/* ---------- Features ---------- */
const TIER_BARS = [
  { tier: "Tier A", ltv: 90, color: "var(--green)" },
  { tier: "Tier B", ltv: 65, color: "#f5a623" },
  { tier: "Tier C", ltv: 35, color: "var(--coral)" },
]

const RULES = [
  "Only the buyer named on an invoice can pay it.",
  "The split has to add up to the invoice total, or the payment reverts.",
  "The fee is 0.5% and the contract will not accept more than 5%.",
  "Only the contract holding the right role can change an invoice.",
]

export function Features() {
  return (
    <section className="st-sec" id="features">
      <div className="st-container">
        <SectionHead
          left
          pretitle="What's in it"
          dot="var(--amber)"
          title="Billing, financing and a payment record in one place"
        />
        <div className="st-features">
          <Appear style={{ gridColumn: "span 4" }}>
            <div className="st-fcard" style={{ ["--tone" as string]: "var(--lilac)" }}>
              <h3 className="st-h3">A pay link for every invoice</h3>
              <p className="st-sm">
                The buyer opens the link, sees the amount, the seller and the due date, and pays from their wallet.
                They don't need an account.
              </p>
              <div className="st-fviz">
                <div className="st-link-chip">
                  your link<b>/pay/1042</b>
                  <span className="st-badge" data-tone="green">Ready to pay</span>
                </div>
              </div>
            </div>
          </Appear>

          <Appear delay={0.1} style={{ gridColumn: "span 2" }}>
            <div className="st-fcard" style={{ ["--tone" as string]: "var(--amber)" }}>
              <h3 className="st-h3">Each invoice is a token</h3>
              <p className="st-sm">
                Creating an invoice mints an ERC-721 to the seller, so the receivable shows up in a wallet and in the
                explorer.
              </p>
              <div className="st-fviz">
                <motion.div
                  className="st-ticket"
                  initial={{ rotate: -14, y: 30, opacity: 0 }}
                  whileInView={{ rotate: -5, y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.3 }}
                >
                  <small>Invoice token</small>
                  <b>#1042</b>
                  <span>SETTL-INV</span>
                </motion.div>
              </div>
            </div>
          </Appear>

          <Appear style={{ gridColumn: "span 3" }}>
            <div className="st-fcard">
              <h3 className="st-h3">Cash before the buyer pays</h3>
              <p className="st-sm">Advance part of an invoice from the funding pool. A better tier means a larger advance.</p>
              <div className="st-fviz">
                {TIER_BARS.map((t, i) => (
                  <div key={t.tier} className="st-tier-row">
                    <span>{t.tier}</span>
                    <div className="st-track">
                      <motion.i
                        style={{ background: t.color }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: t.ltv / 100 }}
                        viewport={{ once: true }}
                        transition={{ type: "tween", ease: EASE_APPEAR, duration: 1.2, delay: 0.2 + i * 0.1 }}
                      />
                    </div>
                    <b>{t.ltv}%</b>
                  </div>
                ))}
              </div>
            </div>
          </Appear>

          <Appear delay={0.1} style={{ gridColumn: "span 3" }}>
            <div className="st-fcard st-fcard-dark">
              <h3 className="st-h3">A score that builds with every invoice</h3>
              <p className="st-sm">
                Sellers start at 450. Each cleared invoice raises the score; 500 reaches Tier B and 850 reaches Tier A.
              </p>
              <div className="st-fviz">
                <div className="st-score">
                  <span className="st-score-tick" style={{ left: "50%" }} />
                  <span className="st-score-tick" style={{ left: "85%" }} />
                  <motion.i
                    initial={{ scaleX: 0.45 }}
                    whileInView={{ scaleX: 0.86 }}
                    viewport={{ once: true }}
                    transition={{ type: "tween", ease: EASE_APPEAR, duration: 2, delay: 0.3 }}
                  />
                </div>
                <div className="st-score-marks">
                  <span style={{ left: 0 }}>0</span>
                  <span style={{ left: "50%" }}>500<br />Tier B</span>
                  <span style={{ left: "85%" }}>850<br />Tier A</span>
                  <span style={{ left: "100%" }}>1000</span>
                </div>
              </div>
            </div>
          </Appear>

          <Appear style={{ gridColumn: "span 2" }}>
            <div className="st-fcard" style={{ ["--tone" as string]: "var(--sky)" }}>
              <h3 className="st-h3">A pool that funds invoices</h3>
              <p className="st-sm">
                Deposit sUSD and receive USMT+ one for one. The pool lends against invoices and is repaid with
                interest when buyers pay.
              </p>
              <div className="st-fviz">
                <div className="st-swap">
                  <div className="st-coin">sUSD</div>
                  <span>1 : 1</span>
                  <div className="st-coin st-coin-dark">USMT+</div>
                </div>
              </div>
            </div>
          </Appear>

          <Appear delay={0.1} style={{ gridColumn: "span 4" }}>
            <div className="st-fcard">
              <h3 className="st-h3">Rules the contracts enforce</h3>
              <div className="st-rules">
                {RULES.map((rule) => (
                  <div key={rule} className="st-rule-li">
                    <i>
                      <Check size={14} strokeWidth={3} />
                    </i>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </Appear>
        </div>
      </div>
    </section>
  )
}

/* ---------- On-chain ---------- */
const RPC_URL = aevumTestnet.rpcUrls.default.http[0]

const NETWORK = [
  { label: "Network", value: aevumTestnet.name },
  { label: "Chain ID", value: String(aevumTestnet.id), copy: true },
  { label: "RPC", value: RPC_URL, copy: true },
  { label: "Gas token", value: aevumTestnet.nativeCurrency.symbol },
  { label: "Stablecoin", value: "sUSD (6 decimals)" },
]

const CONTRACTS: { name: string; role: string; address?: string }[] = [
  { name: "sUSD", role: "SETTL USD, the demo stablecoin", address: contractAddresses.DemoUSDC },
  { name: "InvoiceRegistry", role: "Invoice records and status", address: contractAddresses.InvoiceRegistry },
  { name: "InvoiceNFT", role: "One ERC-721 per invoice", address: contractAddresses.InvoiceNFT },
  { name: "SettlementRouter", role: "Takes the payment and splits it", address: contractAddresses.SettlementRouter },
  { name: "AdvanceEngine", role: "Advances against invoices", address: contractAddresses.AdvanceEngine },
  { name: "Vault", role: "Funding pool", address: contractAddresses.Vault },
  { name: "Reputation", role: "Seller score and tier", address: contractAddresses.Reputation },
]

const CONTRACT_TONES = ["var(--lime)", "var(--lilac)", "var(--amber)", "var(--coral)", "var(--sky)"]

async function addNetwork() {
  const provider = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum
  if (!provider) {
    toast.error("No wallet found", { description: "Install a wallet such as MetaMask, then try again." })
    return
  }
  try {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${aevumTestnet.id.toString(16)}`,
          chainName: aevumTestnet.name,
          nativeCurrency: aevumTestnet.nativeCurrency,
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [EXPLORER_URL],
        },
      ],
    })
    toast.success("QDay Aevum Testnet is in your wallet")
  } catch (err) {
    const rejected = (err as { code?: number })?.code === 4001
    toast.error(rejected ? "Request cancelled" : "Couldn't add the network", {
      description: rejected ? undefined : "Add it by hand with the chain ID and RPC shown here.",
    })
  }
}

export function OnChain() {
  return (
    <section className="st-sec" id="onchain">
      <div className="st-container">
        <SectionHead
          left
          pretitle="On-chain"
          dot="var(--green)"
          title="Check it yourself"
          lead="SETTL. runs on QDay Aevum testnet with test tokens only. Every address opens in the explorer."
        />
        <div className="st-chain">
          <Appear>
            <div className="st-card" style={{ height: "100%" }}>
              <dl style={{ margin: 0 }}>
                {NETWORK.map((row) => (
                  <div key={row.label} className="st-kv">
                    <dt>{row.label}</dt>
                    <dd>
                      <span>{row.value}</span>
                      {row.copy && <CopyButton value={row.value} label={row.label} />}
                    </dd>
                  </div>
                ))}
              </dl>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
                <button type="button" className="st-btn st-btn-sm" onClick={addNetwork}>
                  <Plus size={15} />
                  Add to wallet
                </button>
                <a className="st-btn st-btn-sm" href={FAUCET_URL} target="_blank" rel="noreferrer">
                  Get gas (tQDAY)
                  <ArrowUpRight size={15} />
                </a>
              </div>
            </div>
          </Appear>

          <Appear delay={0.1}>
            <div className="st-card" style={{ padding: "8px 0", height: "100%" }}>
              {CONTRACTS.map((c, i) => (
                <div key={c.name} className="st-contract">
                  <i style={{ background: CONTRACT_TONES[i % CONTRACT_TONES.length] }}>{c.name[0]}</i>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <b>{c.name}</b>
                    <span className="st-xs">{c.role}</span>
                  </div>
                  {c.address ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                      <a
                        className="st-addr"
                        href={`${EXPLORER_URL}/address/${c.address}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {shortAddress(c.address)}
                        <ArrowUpRight size={14} />
                      </a>
                      <CopyButton value={c.address} label={`${c.name} address`} />
                    </div>
                  ) : (
                    <span className="st-badge">Not deployed yet</span>
                  )}
                </div>
              ))}
            </div>
          </Appear>
        </div>
      </div>
    </section>
  )
}
