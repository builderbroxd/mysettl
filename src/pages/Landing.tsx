import { MotionConfig } from "framer-motion"
import { Link } from "react-router-dom"
import { EXPLORER_URL, FAUCET_URL } from "@/lib/chain"
import { Hero } from "@/components/landing/Hero"
import { Calculator, Compare, Features, OnChain, Steps } from "@/components/landing/Sections"
import { Appear, Btn, BtnArrow } from "@/components/landing/ui"
import "@/components/landing/landing.css"

const REPO_URL = "https://github.com/builderbroxd/mysettl"

const NAV = [
  ["#how", "How it works"],
  ["#calculator", "Calculator"],
  ["#features", "Features"],
  ["#onchain", "On-chain"],
]

const FACTS: [string, string][] = [
  ["sUSD", "settlement"],
  ["0.5%", "protocol fee"],
  ["1 transaction", "per payment"],
  ["ERC-721", "invoices"],
  ["Up to 90%", "advance"],
  ["Chain ID", "44005"],
  ["QDay Aevum", "testnet"],
]

function Wordmark() {
  return (
    <Link to="/" className="st-wordmark" aria-label="SETTL. home">
      SETTL<i>.</i>
    </Link>
  )
}

function Nav() {
  return (
    <div className="st-nav-wrap">
      <div className="st-nav">
        <div className="st-nav-in">
          <Wordmark />
          <nav className="st-nav-menu" aria-label="Primary">
            {NAV.map(([href, label]) => (
              <a key={href} className="st-navlink" href={href}>
                {label}
              </a>
            ))}
          </nav>
          <BtnArrow variant="sm" to="/app">
            Open app
          </BtnArrow>
        </div>
      </div>
    </div>
  )
}

function Spark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M12 0c.9 6.6 4.5 10.2 12 12-7.5 1.8-11.1 5.4-12 12-.9-6.6-4.5-10.2-12-12C7.5 10.200 11.1 6.6 12 0Z" />
    </svg>
  )
}

function Ticker() {
  return (
    <section className="st-ticker-sec" aria-label="At a glance">
      <div className="st-ticker">
        {[0, 1].map((copy) => (
          <div key={copy} className="st-ticker-track" aria-hidden={copy === 1}>
            {FACTS.map(([strong, rest]) => (
              <span key={strong} className="st-ticker-item">
                <span>
                  {strong} {rest}
                </span>
                <Spark />
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function Closing() {
  return (
    <>
      <div className="st-block-wrap">
        <Appear>
          <div className="st-closing">
            <span className="st-closing-ring" aria-hidden />
            <span className="st-closing-dot" aria-hidden />
            <span className="st-closing-sq" aria-hidden />
            <h2 className="st-h2">Send your first invoice</h2>
            <p className="st-body">
              Get gas from the faucet, mint demo sUSD in Settings, create an invoice and pay it from a second
              wallet. It takes a few minutes.
            </p>
            <div className="st-buttons" style={{ marginTop: 12 }}>
              <BtnArrow variant="light" to="/app/invoices/new">
                Create an invoice
              </BtnArrow>
              <Btn variant="line" href={FAUCET_URL} external>
                Get gas (tQDAY)
              </Btn>
            </div>
          </div>
        </Appear>
      </div>
      <div className="st-container">
        <footer className="st-footer">
          <span>Built for Aevum Builder Challenge #1. Testnet only, no real funds.</span>
          <nav>
            <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer">Explorer</a>
            <a href={FAUCET_URL} target="_blank" rel="noreferrer">Faucet</a>
          </nav>
        </footer>
      </div>
      <div className="st-giant" aria-hidden>
        SETTL<i>.</i>
      </div>
    </>
  )
}

export default function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="st">
        <Nav />
        <main>
          <Hero />
          <Ticker />
          <Compare />
          <Steps />
          <Calculator />
          <Features />
          <OnChain />
        </main>
        <Closing />
      </div>
    </MotionConfig>
  )
}
