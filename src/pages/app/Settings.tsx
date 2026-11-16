import { motion } from "framer-motion"
import { 
  User, 
  Wallet, 
  Bell, 
  Shield, 
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Coins,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useChainId, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { useSendTransaction, useWallets } from "@privy-io/react-auth"
import { usePrivyAccount } from "@/hooks/usePrivyAccount"
import { contractAddresses } from "@/lib/contracts"
import { EXPLORER_URL, FAUCET_URL } from "@/lib/chain"
import { DemoUSDCABI } from "@/lib/abis"
import { parseUnits, formatUnits, encodeFunctionData } from "viem"
import { isAddress } from "viem"

export default function Settings() {
  const [showWallet, setShowWallet] = useState(false)
  const { address } = usePrivyAccount()
  const chainId = useChainId()
  
  // Get deployer address from contracts.json
  const deployerAddress = "0x9C7dCfd1E28B467C6AfBcc60b4E9a16ba6f3E0D6" // From deployment
  const isOwner = address?.toLowerCase() === deployerAddress.toLowerCase()
  const isTestnet = chainId === 44005

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    } else {
      toast.error("No wallet connected")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-secondary p-2">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" placeholder="Your name or business" defaultValue="Acme Corp" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" defaultValue="billing@acme.com" />
          </div>
        </div>

        <Button className="mt-4" variant="default">Save Changes</Button>
      </div>

      {/* Wallet */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-secondary p-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Wallet</h2>
        </div>

        <div className="space-y-4">
          {address ? (
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Connected Wallet</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {showWallet 
                      ? address 
                      : `${address.slice(0, 6)}...${address.slice(-4)}`
                    }
                  </p>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowWallet(!showWallet)}>
                    {showWallet ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`https://explorer-test.qday.info/address/${address}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">No wallet connected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect your wallet using the button in the top bar
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Add External Wallet</p>
              <p className="text-sm text-muted-foreground">Connect an additional wallet for advanced features</p>
            </div>
            <Button variant="outline">Connect Wallet</Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-secondary p-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>

        <div className="space-y-4">
          <NotificationToggle
            title="Invoice Payments"
            description="Get notified when invoices are paid"
            defaultChecked
          />
          <NotificationToggle
            title="Financing Updates"
            description="Updates on advance requests and repayments"
            defaultChecked
          />
          <NotificationToggle
            title="Reputation Changes"
            description="Score updates and tier unlocks"
            defaultChecked
          />
          <NotificationToggle
            title="Vault Activity"
            description="Deposits, withdrawals, and earnings"
            defaultChecked={false}
          />
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-secondary p-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Privacy</h2>
        </div>

        <div className="space-y-4">
          <NotificationToggle
            title="Hide Wallet Balance"
            description="Mask your balance on the dashboard"
            defaultChecked={false}
          />
          <NotificationToggle
            title="Anonymous Mode"
            description="Hide your identity from public invoice links"
            defaultChecked={false}
          />
          <NotificationToggle
            title="Activity Tracking"
            description="Allow analytics to improve your experience"
            defaultChecked
          />
        </div>
      </div>

      {/* Demo Setup */}
      {isTestnet && (
        <DemoSetupPanel 
          isOwner={isOwner} 
          isTestnet={isTestnet}
          chainId={chainId}
          currentAddress={address}
          deployerAddress={deployerAddress}
        />
      )}

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <h2 className="mb-2 text-lg font-semibold text-destructive">Danger Zone</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
            Delete All Data
          </Button>
          <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
            Disconnect Account
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function DemoSetupPanel({
  isTestnet,
  chainId,
  currentAddress,
}: {
  isOwner: boolean
  isTestnet: boolean
  chainId: number
  currentAddress?: string
  deployerAddress: string
}) {
  const [mintAmount, setMintAmount] = useState("1000")
  const [mintToAddress, setMintToAddress] = useState(currentAddress || "")
  const { sendTransaction } = useSendTransaction()
  const { wallets } = useWallets()

  const embeddedWallet = wallets.find(w => {
    const ct = w.connectorType?.toLowerCase() || '';
    const wct = w.walletClientType?.toLowerCase() || '';
    return ct === 'embedded' || wct === 'privy' || ct.includes('privy') || ct.includes('embedded');
  }) || wallets[0]

  const [mintHash, setMintHash] = useState<`0x${string}` | null>(null)
  const [isMinting, setIsMinting] = useState(false)

  const { isLoading: isMintConfirming, isSuccess: isMintConfirmed } = useWaitForTransactionReceipt({
    hash: mintHash ?? undefined,
  })

  // Transactions are signed by the embedded wallet, which can differ from the account shown
  // elsewhere when an external wallet is also connected. Gas and minted sUSD must go to the signer.
  const signerAddress = embeddedWallet?.address || currentAddress
  const signerDiffers =
    !!signerAddress && !!currentAddress && signerAddress.toLowerCase() !== currentAddress.toLowerCase()

  useEffect(() => {
    if (signerAddress) setMintToAddress(signerAddress)
  }, [signerAddress])

  useEffect(() => {
    if (isMintConfirmed) toast.success("sUSD minted")
  }, [isMintConfirmed])

  const handleMint = async () => {
    if (!isTestnet) {
      toast.error("Wrong network", { description: "Switch to QDay Aevum Testnet to mint sUSD." })
      return
    }
    if (!contractAddresses.DemoUSDC) {
      toast.error("sUSD isn't configured", { description: "Set VITE_DEMO_USDC_ADDRESS in .env." })
      return
    }
    if (!mintToAddress || !isAddress(mintToAddress)) {
      toast.error("Invalid address", { description: "Enter a valid wallet address." })
      return
    }
    const amount = parseFloat(mintAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount", { description: "Enter an amount greater than 0." })
      return
    }
    if (!embeddedWallet) {
      toast.error("No wallet connected", { description: "Log in first, then try again." })
      return
    }

    setIsMinting(true)
    try {
      const data = encodeFunctionData({
        abi: DemoUSDCABI,
        functionName: "mint",
        args: [mintToAddress as `0x${string}`, parseUnits(mintAmount, 6)],
      })
      const result = await sendTransaction(
        { to: contractAddresses.DemoUSDC as `0x${string}`, data, value: 0n, chainId: 44005 },
        { address: embeddedWallet.address, uiOptions: { showWalletUIs: false } },
      )
      setMintHash(result.hash)
      toast.success("Mint submitted")
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      const noGas = /insufficient funds/i.test(message)
      toast.error(noGas ? "Not enough tQDAY for gas" : "Mint failed", {
        description: noGas ? "Get tQDAY from the faucet, then mint again." : message || "Please try again.",
      })
    } finally {
      setIsMinting(false)
    }
  }

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Address copied")
    } catch {
      toast.error("Couldn't copy", { description: "Select the address and copy it by hand." })
    }
  }

  return (
    <div className="rounded-3xl bg-amber/50 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-full bg-white/60 p-2">
          <Coins className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Demo setup</h2>
          <p className="text-xs text-foreground/70">QDay Aevum Testnet, chain ID 44005. No real funds.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-card p-4">
          <div>
            <p className="text-sm font-medium">Network</p>
            <p className="text-xs text-muted-foreground">
              Chain ID {chainId} {isTestnet ? "(QDay Aevum Testnet)" : "(wrong network)"}
            </p>
          </div>
          {isTestnet ? (
            <div className="flex items-center gap-2 text-success">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-bold">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-bold">Switch to Aevum</span>
            </div>
          )}
        </div>

        {/* Step 1: gas */}
        <div className="rounded-2xl bg-card p-4">
          <p className="text-sm font-medium">1. Get tQDAY for gas</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste this address into the QDay faucet. It is the wallet that signs your transactions, and it only
            needs tQDAY for fees.
          </p>
          {signerDiffers && (
            <p className="mt-2 rounded-2xl bg-coral/30 px-3 py-2 text-xs">
              This is your embedded wallet. It is not the external wallet shown in the top bar, and funds sent
              to that one can't pay for transactions made here.
            </p>
          )}
          {signerAddress && (
            <div className="mt-3 flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{signerAddress}</span>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copy(signerAddress)}>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <a href={FAUCET_URL} target="_blank" rel="noreferrer">
              Open the faucet
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        {/* Step 2: mint */}
        <div className="space-y-3 rounded-2xl bg-card p-4">
          <div>
            <p className="text-sm font-medium">2. Mint sUSD</p>
            <p className="mt-1 text-xs text-muted-foreground">
              SETTL USD is the demo stablecoin invoices are paid in. Mint it to any address.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mintToAddress">Recipient address</Label>
            <Input
              id="mintToAddress"
              placeholder="0x..."
              value={mintToAddress}
              onChange={(e) => setMintToAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mintAmount">Amount (sUSD)</Label>
            <Input
              id="mintAmount"
              type="number"
              placeholder="1000"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <Button
            onClick={handleMint}
            disabled={isMinting || isMintConfirming || !isTestnet}
            variant="hero"
            className="w-full"
          >
            {isMinting || isMintConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isMinting ? "Waiting for wallet..." : "Minting..."}
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                Mint {mintAmount || 0} sUSD
              </>
            )}
          </Button>

          {mintHash && (
            <a
              href={`${EXPLORER_URL}/tx/${mintHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View the mint transaction
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationToggle({
  title,
  description,
  defaultChecked,
}: {
  title: string
  description: string
  defaultChecked?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  )
}
