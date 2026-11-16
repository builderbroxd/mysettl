import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"
import { EXPLORER_URL, FAUCET_URL } from "@/lib/chain"
import { contractAddresses } from "@/lib/contracts"
import { BtnArrow, CopyButton, shortAddress } from "@/components/landing/ui"
import "@/components/landing/landing.css"
import "@/components/landing/docs.css"

const REPO_URL = "https://github.com/builderbroxd/mysettl"
const APP_URL = "https://mysettl-nu.vercel.app"

const SECTIONS: [string, string][] = [
  ["overview", "Overview"],
  ["try", "Try SETTL. step by step"],
  ["workflows", "Core workflows"],
  ["architecture", "System architecture"],
  ["contracts", "Deployed contracts"],
  ["security", "Security model"],
  ["stack", "Technologies"],
  ["local", "Run it locally"],
  ["limits", "Limitations and roadmap"],
]

function Section({ id, title, kicker, children }: { id: string; title: string; kicker: string; children: ReactNode }) {
  return (
    <section id={id} className="st-doc-sec">
      <span className="st-doc-kicker">{kicker}</span>
      <h2 className="st-doc-h2">{title}</h2>
      {children}
    </section>
  )
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="st-doc-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={14} aria-hidden />
    </a>
  )
}

function Step({ n, title, children, tag }: { n: number; title: string; children: ReactNode; tag?: string }) {
  return (
    <li className="st-doc-step">
      <span className="st-doc-step-n">{n}</span>
      <div className="st-doc-step-body">
        <h3 className="st-doc-h3">
          {title}
          {tag && <span className="st-doc-tag">{tag}</span>}
        </h3>
        {children}
      </div>
    </li>
  )
}

const CONTRACTS: { name: string; key: keyof typeof contractAddresses; role: string }[] = [
  { name: "sUSD (SETTL USD)", key: "DemoUSDC", role: "6-decimal demo stablecoin every invoice is paid in. Mintable on test chains only." },
  { name: "InvoiceRegistry", key: "InvoiceRegistry", role: "Creates invoices and owns their status: Issued → Financed → Paid → Cleared." },
  { name: "InvoiceNFT", key: "InvoiceNFT", role: "ERC-721 minted to the seller for every invoice, so the receivable is a token." },
  { name: "AdvanceEngine", key: "AdvanceEngine", role: "Prices and issues advances against Issued invoices, and tracks what is owed." },
  { name: "Vault", key: "Vault", role: "Liquidity pool. Takes LP deposits and lends to AdvanceEngine." },
  { name: "USMTPlus", key: "USMTPlus", role: "LP receipt token, minted 1:1 on deposit and burned on withdrawal." },
  { name: "Staking", key: "Staking", role: "Swaps USMT+ for sUSMT+ 1:1." },
  { name: "SettlementRouter", key: "SettlementRouter", role: "Takes the buyer's payment and runs the settlement waterfall in one transaction." },
  { name: "Reputation", key: "Reputation", role: "On-chain score (0–1000) and tier for every seller." },
]

export default function Docs() {
  const [active, setActive] = useState("overview")

  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (seen[0]) setActive(seen[0].target.id)
      },
      { rootMargin: "-20% 0px -70% 0px" },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="st st-docs">
      <header className="st-doc-top">
        <div className="st-doc-top-in">
          <Link to="/" className="st-wordmark" aria-label="SETTL. home">
            SETTL<i>.</i>
          </Link>
          <span className="st-doc-top-label">Docs</span>
          <nav className="st-doc-top-nav">
            <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer">Explorer</a>
            <BtnArrow variant="sm" to="/app">
              Open app
            </BtnArrow>
          </nav>
        </div>
      </header>

      <div className="st-doc-hero">
        <div className="st-doc-wrap">
          <span className="st-pretitle st-pretitle-dark" style={{ ["--dot" as string]: "var(--lime)" }}>
            Project documentation
          </span>
          <h1 className="st-doc-h1">
            Invoices that get paid, financed and settled <em>on-chain</em>
          </h1>
          <p className="st-doc-lead">
            SETTL. turns an invoice into a payment link on the QDay Aevum testnet. The seller can borrow against it before the
            buyer pays, and one payment from the buyer settles the fee, the pool and the seller in a single transaction.
          </p>
          <div className="st-doc-hero-facts">
            <div><b>9</b><span>contracts live on Aevum</span></div>
            <div><b>1 tx</b><span>per invoice payment</span></div>
            <div><b>0.5%</b><span>protocol fee</span></div>
            <div><b>8</b><span>contract tests</span></div>
          </div>
        </div>
      </div>

      <div className="st-doc-wrap st-doc-grid">
        <aside className="st-doc-toc" aria-label="On this page">
          <p className="st-doc-toc-title">On this page</p>
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? "is-active" : undefined}>
              {label}
            </a>
          ))}
        </aside>

        <main className="st-doc-main">
          <Section id="overview" kicker="01" title="Overview">
            <h3 className="st-doc-h3">The problem</h3>
            <p className="st-doc-p">
              Small businesses wait 30 to 90 days for invoices to be paid. Factoring, the usual fix, is slow, paper-heavy and
              mostly closed to small sellers. Stablecoins move instantly, but nothing ties an invoice, the money to finance
              it and the payment that closes it into one flow a seller and a buyer can both use.
            </p>
            <h3 className="st-doc-h3">What SETTL. does</h3>
            <div className="st-doc-cards">
              <div className="st-doc-card" data-tone="lime"><b>Invoice as a link</b><p>Every invoice is recorded on-chain, minted as an ERC-721 to the seller and shared as a <code>/pay/&lt;id&gt;</code> link.</p></div>
              <div className="st-doc-card" data-tone="amber"><b>Cash before the buyer pays</b><p>Sellers can take an advance from a shared liquidity pool. Their reputation tier sets the limit: 35%, 65% or 90%.</p></div>
              <div className="st-doc-card" data-tone="lilac"><b>One payment settles it</b><p>The buyer pays once. The contract takes the 0.5% fee, repays the pool with interest and sends the seller the rest, atomically.</p></div>
              <div className="st-doc-card" data-tone="coral"><b>Credit that builds</b><p>Every cleared invoice adds to the seller's on-chain score, which raises how much they can borrow next time.</p></div>
            </div>
          </Section>

          <Section id="try" kicker="02" title="Try SETTL. step by step">
            <p className="st-doc-p">
              About five minutes on the QDay Aevum testnet. You need two wallets: one for the seller and one for the buyer. The
              easiest way is to log in with two different emails, for example one in a private window. Privy creates an embedded
              wallet for each.
            </p>
            <div className="st-doc-net">
              <div><span>Network</span><b>QDay Aevum Testnet</b></div>
              <div><span>Chain ID</span><b>44005</b></div>
              <div><span>RPC</span><b>rpc-test.qday.info</b></div>
              <div><span>Gas token</span><b>tQDAY</b></div>
            </div>
            <ol className="st-doc-steps">
              <Step n={1} title="Open the app and log in">
                <p>Go to <Ext href={APP_URL}>mysettl-nu.vercel.app</Ext>, choose <b>Open app</b> and log in with email. The green <b>Aevum</b> badge in the top bar confirms the network.</p>
              </Step>
              <Step n={2} title="Get gas from the faucet">
                <p>Open <b>Settings → Demo setup</b>, copy the address under <b>1. Get tQDAY for gas</b> and paste it into the <Ext href={FAUCET_URL}>QDay faucet</Ext>. One claim gives 5 tQDAY, which covers every step below. Do the same for the buyer wallet.</p>
              </Step>
              <Step n={3} title="Mint sUSD">
                <p>Under <b>2. Mint sUSD</b>, enter an address and an amount and press <b>Mint</b>. Mint some to the buyer too, since the buyer pays the invoice in sUSD.</p>
              </Step>
              <Step n={4} title="Create an invoice">
                <p>Go to <b>Invoices → Create Invoice</b>. Enter the buyer's wallet address, add line items and pick a due date, then press <b>Create Invoice On-Chain</b> and confirm. The invoice is recorded on-chain and minted to you as an NFT, and the success dialog links to the transaction.</p>
              </Step>
              <Step n={5} title="Share the payment link">
                <p>Open the invoice. Under <b>Share Payment Link with Buyer</b>, copy the <code>/pay/&lt;id&gt;</code> link and send it to the buyer. You can also open it yourself to see what the buyer sees.</p>
              </Step>
              <Step n={6} title="Take an advance" tag="optional">
                <p>If you need the money before the buyer pays, open <b>Financing</b> and press <b>Request Advance</b> on the invoice. A new seller is Tier C: up to 35% of the invoice at 18% APR, charged only up to the due date. The sUSD comes straight from the pool, and the invoice moves to <b>Financed</b>.</p>
              </Step>
              <Step n={7} title="Pay as the buyer">
                <p>Open the link logged in as the buyer. Press <b>Approve</b> to let the router spend the sUSD, then <b>Pay</b>. Only the buyer named on the invoice can pay it, and only once.</p>
              </Step>
              <Step n={8} title="Check the settlement">
                <p>The invoice moves to <b>Cleared</b>. On the explorer the payment shows every transfer from one transaction: the fee to the treasury, the repayment to the pool if there was an advance, and the remainder to the seller. Your <b>Reputation</b> score goes up by 20.</p>
              </Step>
            </ol>
            <div className="st-doc-note">
              <b>Want to fund advances?</b> Open <b>Funding Pool</b>, press <b>Deposit sUSD</b> and receive USMT+ 1:1. Advances are paid out of this pool.
            </div>
          </Section>

          <Section id="workflows" kicker="03" title="Core workflows">
            <h3 className="st-doc-h3">Invoice lifecycle</h3>
            <div className="st-doc-flow">
              <span data-tone="sky">Issued</span><i>→</i><span data-tone="amber">Financed <small>optional</small></span><i>→</i><span data-tone="lilac">Paid</span><i>→</i><span data-tone="green">Cleared</span>
            </div>
            <p className="st-doc-p">
              <code>InvoiceRegistry</code> enforces the order. Only <code>AdvanceEngine</code> can mark an invoice Financed, and only
              <code>SettlementRouter</code> can mark it Paid and Cleared.
            </p>

            <h3 className="st-doc-h3">Settlement waterfall</h3>
            <p className="st-doc-p">When the buyer calls <code>payInvoice</code>, <code>SettlementRouter</code> pulls the full amount and, in the same transaction:</p>
            <ol className="st-doc-list">
              <li>sends the protocol fee (0.5%, capped at 5% in the contract) to the treasury,</li>
              <li>if the invoice was financed, repays the pool its principal plus interest,</li>
              <li>sends the seller the remainder,</li>
              <li>marks the invoice Cleared and updates the seller's reputation.</li>
            </ol>
            <div className="st-doc-example">
              <p className="st-doc-example-title">Live example: invoice #1, settled 16 Nov 2026</p>
              <div className="st-doc-bar">
                <span style={{ width: "1.5%", background: "var(--coral)" }} />
                <span style={{ width: "35.5%", background: "var(--violet)" }} />
                <span style={{ width: "63%", background: "var(--green)" }} />
              </div>
              <div className="st-doc-rows">
                <div><span>Buyer pays</span><b>10,000.00 sUSD</b></div>
                <div><span><i style={{ background: "var(--coral)" }} />Protocol fee → treasury</span><b>50.00</b></div>
                <div><span><i style={{ background: "var(--violet)" }} />Pool repayment (3,500 + 51.78 interest)</span><b>3,551.78</b></div>
                <div><span><i style={{ background: "var(--green)" }} />Seller payout</span><b>6,398.22</b></div>
              </div>
              <Ext href={`${EXPLORER_URL}/tx/0x1466562c02e668d225ce06e186646ec52ac43ca60a648f30d66809b8655d52c4`}>See the transaction on the explorer</Ext>
            </div>

            <h3 className="st-doc-h3">Advance pricing</h3>
            <div className="st-doc-formula">
              <code>advance = invoice amount × LTV</code>
              <code>interest = advance × APR × days until due ÷ 365</code>
            </div>
            <p className="st-doc-p">Interest is simple and stops at the due date. In the example, 3,500 at 18% for 30 days is 51.78.</p>

            <h3 className="st-doc-h3">Reputation tiers</h3>
            <table className="st-doc-table">
              <thead><tr><th>Tier</th><th>Score</th><th>Max advance</th><th>APR</th></tr></thead>
              <tbody>
                <tr><td>C</td><td>0–499 (new sellers start at 450)</td><td>35%</td><td>18%</td></tr>
                <tr><td>B</td><td>500–849</td><td>65%</td><td>8–12%</td></tr>
                <tr><td>A</td><td>850–1000</td><td>90%</td><td>6–8%</td></tr>
              </tbody>
            </table>
            <p className="st-doc-p">Each cleared invoice adds 20 points, plus 1 point per 1M sUSD of volume, capped at 1000.</p>

            <h3 className="st-doc-h3">Liquidity</h3>
            <p className="st-doc-p">
              Liquidity providers deposit sUSD into the <code>Vault</code> and receive USMT+ 1:1. <code>AdvanceEngine</code> borrows
              from the Vault to pay advances, and every financed settlement returns principal plus interest to it. An advance can
              never exceed the liquidity the pool has free.
            </p>
          </Section>

          <Section id="architecture" kicker="04" title="System architecture">
            <div className="st-doc-arch">
              <div className="st-doc-arch-row">
                <div className="st-doc-arch-box" data-tone="sky"><b>Seller</b><small>creates, shares, borrows</small></div>
                <div className="st-doc-arch-box" data-tone="sky"><b>Buyer</b><small>pays the link</small></div>
                <div className="st-doc-arch-box" data-tone="amber"><b>Liquidity provider</b><small>funds the pool</small></div>
              </div>
              <div className="st-doc-arch-arrow">↓</div>
              <div className="st-doc-arch-row">
                <div className="st-doc-arch-box st-doc-arch-wide" data-tone="paper">
                  <b>React app (Vite + TypeScript)</b>
                  <small>Privy embedded wallets · wagmi + viem · invoice, financing, pool, reputation and pay pages</small>
                </div>
              </div>
              <div className="st-doc-arch-arrow">↓ contract calls on chain 44005</div>
              <div className="st-doc-arch-chain">
                <p className="st-doc-arch-label">QDay Aevum Testnet</p>
                <div className="st-doc-arch-cols">
                  <div>
                    <p className="st-doc-arch-group">Invoices</p>
                    <div className="st-doc-arch-box" data-tone="green"><b>InvoiceRegistry</b><small>status machine</small></div>
                    <div className="st-doc-arch-box" data-tone="green"><b>InvoiceNFT</b><small>ERC-721 per invoice</small></div>
                  </div>
                  <div>
                    <p className="st-doc-arch-group">Financing</p>
                    <div className="st-doc-arch-box" data-tone="amber"><b>AdvanceEngine</b><small>prices advances</small></div>
                    <div className="st-doc-arch-box" data-tone="amber"><b>Vault + USMT+</b><small>pool and LP receipt</small></div>
                    <div className="st-doc-arch-box" data-tone="amber"><b>Staking</b><small>USMT+ → sUSMT+</small></div>
                  </div>
                  <div>
                    <p className="st-doc-arch-group">Settlement</p>
                    <div className="st-doc-arch-box" data-tone="lilac"><b>SettlementRouter</b><small>atomic waterfall</small></div>
                    <div className="st-doc-arch-box" data-tone="lilac"><b>Reputation</b><small>score and tier</small></div>
                    <div className="st-doc-arch-box" data-tone="paper"><b>sUSD</b><small>settlement token</small></div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="st-doc-h3">Who can call what</h3>
            <p className="st-doc-p">Contracts trust each other through OpenZeppelin <code>AccessControl</code> roles, granted once at deploy time:</p>
            <ul className="st-doc-list">
              <li><code>InvoiceRegistry</code> holds <code>MINTER_ROLE</code> on InvoiceNFT.</li>
              <li><code>Vault</code> holds <code>MINTER_ROLE</code> on USMT+.</li>
              <li><code>AdvanceEngine</code> holds <code>BORROWER_ROLE</code> on the Vault and <code>ADVANCE_ENGINE_ROLE</code> on the registry.</li>
              <li><code>SettlementRouter</code> holds <code>SETTLEMENT_ROUTER_ROLE</code> on the registry, AdvanceEngine and Reputation.</li>
            </ul>
          </Section>

          <Section id="contracts" kicker="05" title="Deployed contracts">
            <p className="st-doc-p">QDay Aevum Testnet, chain ID 44005, deployed 16 Nov 2026. The full record with every deploy and role transaction is in <code>deployments/44005.json</code>.</p>
            <div className="st-doc-contracts">
              {CONTRACTS.map(({ name, key, role }) => {
                const address = contractAddresses[key]
                return (
                  <div key={name} className="st-doc-contract">
                    <div>
                      <b>{name}</b>
                      <p>{role}</p>
                    </div>
                    {address ? (
                      <div className="st-doc-addr">
                        <a href={`${EXPLORER_URL}/address/${address}`} target="_blank" rel="noreferrer">{shortAddress(address)}</a>
                        <CopyButton value={address} label={`${name} address`} />
                      </div>
                    ) : (
                      <span className="st-doc-addr">not configured</span>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>

          <Section id="security" kicker="06" title="Security model">
            <ul className="st-doc-checks">
              <li>Only the buyer named on an invoice can pay it, and only once.</li>
              <li>Only the seller can take an advance, never on an invoice that is already financed or paid, and never for more than the pool has free.</li>
              <li>Fee, pool repayment and seller payout move in one transaction, and the router keeps no balance between settlements.</li>
              <li>The protocol fee is capped at 5% in the contract, and only the admin can change it.</li>
              <li>State changes between contracts are gated by AccessControl roles (see Architecture).</li>
              <li>sUSD refuses to mint anywhere but a test chain.</li>
              <li>Contracts are not upgradeable and have not been audited. Testnet only.</li>
            </ul>
            <p className="st-doc-p">
              The Hardhat suite in <code>test/settlement.test.cjs</code> covers these rules, and <code>scripts/e2e-aevum.cjs</code> replays the
              full flow against the live deployment.
            </p>
          </Section>

          <Section id="stack" kicker="07" title="Technologies">
            <div className="st-doc-stack">
              {[
                ["Contracts", "Solidity 0.8.24 · OpenZeppelin v5 · Hardhat"],
                ["Chain", "QDay Aevum Testnet (EVM, chain 44005) · Blockscout explorer"],
                ["Frontend", "React 18 · Vite · TypeScript · Tailwind CSS · Framer Motion"],
                ["Wallets", "Privy embedded wallets · wagmi · viem"],
                ["Extras", "jsPDF invoices · Reclaim Protocol zkTLS proofs (optional)"],
                ["Hosting", "Vercel"],
              ].map(([k, v]) => (
                <div key={k}><span>{k}</span><b>{v}</b></div>
              ))}
            </div>
          </Section>

          <Section id="local" kicker="08" title="Run it locally">
            <pre className="st-doc-pre"><code>{`git clone ${REPO_URL}.git
cd mysettl
npm install
cp .env.example .env     # already points at the live Aevum contracts; add VITE_PRIVY_APP_ID
npm run dev              # http://localhost:8080

npm test                 # contract tests on a local Hardhat chain
npm run deploy:aevum     # fresh deployment (needs DEPLOYER_PRIVATE_KEY with tQDAY)
npx hardhat run scripts/e2e-aevum.cjs --network aevumTestnet   # live end-to-end run`}</code></pre>
          </Section>

          <Section id="limits" kicker="09" title="Limitations and roadmap">
            <ul className="st-doc-list">
              <li><b>Settlement token.</b> The demo settles in sUSD so anyone can mint test funds. The contracts take any 6-decimal stablecoin at deploy time (<code>STABLECOIN_ADDRESS</code>), so tUSD8 drops straight in.</li>
              <li><b>Staking yield.</b> Staking swaps USMT+ for sUSMT+ 1:1; a yield-bearing exchange rate is not built yet.</li>
              <li><b>Overdue invoices.</b> There is no default or late-fee handling yet.</li>
              <li><b>Next:</b> tradeable invoice NFTs for other financiers, buyer-side reputation, and mainnet with tUSD8 as the default asset.</li>
            </ul>
          </Section>

          <div className="st-doc-end">
            <h2 className="st-doc-h2">Send your first invoice</h2>
            <div className="st-buttons">
              <BtnArrow variant="light" to="/app/invoices/new">Create an invoice</BtnArrow>
              <a className="st-btn" href={FAUCET_URL} target="_blank" rel="noreferrer">Get gas (tQDAY)</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
