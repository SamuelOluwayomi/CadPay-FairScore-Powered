# CadPay - FairScale Sybil-Resistant Subscriptions

> **FairScale Integration** - Subscription payments with reputation-based Sybil protection on Solana.

CadPay demonstrates FairScale reputation scoring integration to prevent Sybil attacks on crypto subscription services. Built on Solana with Lazorkit Account Abstraction, users create passkey wallets and subscribe to services—with FairScale ensuring only trusted users can claim free resources.

## 🎯 FairScale Bounty Implementation

This project fulfills the [FairScale Solana Build Bounty](https://earn.superteam.fun/listing/fairscale-solana-build-bounty-ship-a-fairscore-powered-prototype) requirements:

**Sybil Protection Features:**
- 🛡️ **Faucet Protection** - Private treasury only funds wallets with FairScore ≥ 40
- 🏪 **Merchant Trust Gates** - Services can require minimum trust scores
- 📊 **Trust Dashboard** - Live reputation scoring with visual feedback
- 🔄 **Mock Integration** - Fully functional demo ready for live API credentials

## 🔑 Key Features

### Core Functionality
- 🔐 **Passkey Wallets** - Biometric login (Face ID, Touch ID, Windows Hello) via Lazorkit
- ⚡ **Gasless Transactions** - Lazorkit Paymaster sponsors all transaction fees
- 💳 **Subscription Management** - Netflix, Spotify, and custom services
- 📊 **Merchant Dashboard** - Live transaction tracking with trust requirements
- 🌟 **Jupiter DEX Integration** - Auto-swap subscriptions with best rates
- 🏦 **Savings Pots** - Create time-locked savings accounts with USDC
- 💸 **Send USDC** - Transfer tokens to any Solana address with memo support
- 📱 **Unified Send Modal** - Single interface for transfers and savings deposits

### FairScale Reputation Features
- **CadPay Reputation Boost** - Earn additional trust score points based on savings behavior
  - Base boost: +2 points per active savings pot
  - Duration multiplier: Extra points for long-term commitments (3, 6, 12+ months)
  - Balance bonus: +1 point per 10 USDC saved
  - Maximum boost: +30 points (capped)
- **Visual Score Display** - Real-time trust score with color-coded tiers
- **Auto-dismissing Boost Notifications** - Instant feedback when reputation increases

## 🛠️ Tech Stack

- **Framework:** Next.js 16.1.1 (React 19, Turbopack)
- **Blockchain:** Solana (Devnet)
- **Reputation:** FairScale API (Mock Integration)
- **Account Abstraction:** Lazorkit SDK v2.0.1
- **Payments:** USDC SPL Token (Devnet)
- **Token Library:** @solana/spl-token v0.4.9
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **Charts:** Recharts

## 📋 Prerequisites

- Node.js 18+ and npm
- Modern browser with WebAuthn support
- Device with biometric authentication (for passkey creation)

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/SamuelOluwayomi/solana-subscriptions-starter
cd solana-subscriptions-starter
npm install
```

> **Note:** If you encounter PowerShell execution policy errors on Windows, use:
> ```bash
> powershell -ExecutionPolicy Bypass -Command "npm install"
> ```

### 2. Environment Setup

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_LAZORKIT_APP_ID=your_app_id_here
NEXT_PUBLIC_LAZORKIT_PUBLIC_KEY=your_public_key_here
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Treasury for private faucet (Sybil protection)
TREASURY_SECRET_KEY=your_treasury_secret_key

# Optional: Address Lookup Table for transaction compression
NEXT_PUBLIC_LOOKUP_TABLE_ADDRESS=your_alt_address_here
```

**Getting Lazorkit Credentials:**
1. Visit [Lazorkit Dashboard](https://lazorkit.com)
2. Create a new app
3. Copy your App ID and Public Key
4. Add them to your `.env.local`

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

## 📱 Using CadPay

### First-Time User Flow

1. **Create Account**
   - Click "Create Account" in the navbar
   - Follow the passkey creation flow (Face ID/Touch ID/Windows Hello)
   - Your smart wallet is created instantly (no seed phrases!)

2. **Complete Onboarding**
   - Set your username, avatar emoji, and 4-digit PIN
   - Your profile is stored on-chain via Anchor program

3. **Fund Your Wallet**
   - Navigate to "Wallet & Cards" section
   - Click "Get Free USDC" to mint 50 USDC from the faucet
   - FairScale trust score determines eligibility (≥40 required for faucet)

4. **Subscribe to Services**
   - Go to "My Subscriptions"
   - Browse available services (Netflix, Spotify, etc.)
   - Click "Subscribe" and select a plan
   - Confirm the transaction with your passkey

5. **Create Savings Pots** (Optional)
   - Navigate to "Savings Wallet"
   - Click "Create New Pot"
   - Set pot name, unlock date, and initial deposit
   - Track your savings and earn reputation boosts

6. **Send USDC** (Optional)
   - Click "Send" from Overview or Wallet sections
   - Enter recipient address and amount
   - Add optional memo (up to 50 characters)
   - Choose between regular transfer or savings pot deposit

### Merchant Portal

Merchants can manage subscriptions and view analytics.

**Demo Login Credentials:**
- **Email:** `demo@cadpay.xyz`
- **Password:** `admin123`

**Merchant Features:**
- Live transaction ledger with service names from memos
- Total revenue and MRR calculations based on actual transfer amounts
- Revenue split chart by unique subscription services
- Customer count (unique wallet addresses)
- FairScale trust gate toggle for individual services

## 🎮 FairScale Integration Demo

### Sybil Guard Flow (User Side):

1. **Create Wallet** - Generate passkey-based wallet
2. **Check Trust Score** - FairScale mock service returns deterministic score based on wallet address
3. **Request Funding** - Low-score wallets (<40) are rejected with clear error message
4. **High-Score Success** - Trusted wallets (≥40) receive 50 USDC from demo minting function

### Trust Score Boost (Savings Feature):

1. **Create Savings Pot** - Set up time-locked USDC savings
2. **Automatic Boost** - CadPay calculates bonus reputation points:
   - Active commitment: +2 points per pot
   - Duration multiplier: 1x (3mo), 1.5x (6mo), 3x (12mo+)
   - Balance bonus: +1 per 10 USDC
3. **Visual Feedback** - Auto-dismissing notification shows boost amount
4. **Updated Score** - Final trust score = FairScale base + CadPay boost (max +30)

### Merchant Trust Gates:

1. Navigate to **Merchant Portal** (`/merchant-auth` → `/merchant`)
2. View services with "FairScale Trust Gate" indicator
3. Users below minimum score threshold cannot subscribe
4. Clear error messages guide low-score users

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── fairscale/      # FairScale score endpoint
│   │   ├── faucet/         # Token minting with trust check
│   │   └── fund-rent/      # Account rent funding
│   ├── dashboard/          # Main user dashboard
│   ├── merchant/           # Merchant analytics portal
│   └── create/             # Wallet creation flow
├── components/
│   ├── security/           # TrustScore, ReputationLevel widgets
│   ├── subscriptions/      # Service cards, subscription management
│   └── shared/             # Modals, forms, reusable UI
├── hooks/
│   ├── useLazorkit.ts      # Wallet connection & transactions
│   ├── useUSDCBalance.ts   # Real-time balance tracking
│   ├── useSubscriptions.ts # Subscription state management
│   └── useUserProfile.ts   # On-chain profile interaction
├── services/
│   └── fairscale.ts        # FairScale API integration (mock)
├── utils/
│   ├── cadpayToken.ts      # USDC minting & transfer logic
│   ├── savingsAccounts.ts  # Savings pot PDA derivation
│   └── rpc.ts              # Connection retry mechanism
└── context/                # React contexts for global state
```

## 🔧 Recent Updates & Fixes

### January 2026
- ✅ **Updated @solana/spl-token** from v0.1.8 to v0.4.9 (fixed build errors)
- ✅ **Added missing SPL token imports** in dashboard page
- ✅ **Improved transaction size optimization** for smart wallets
- ✅ **Enhanced savings pot validation** with better error messages
- ✅ **Fixed build compatibility** with Next.js 16 Turbopack

## 🔄 FairScale Code Reference

### Mock Service (`src/services/fairscale.ts`)

```typescript
export async function getFairScore(walletAddress: string): Promise<FairScoreResponse> {
    // Mock implementation - generates deterministic score from wallet address
    const score = generateMockScore(walletAddress);
    const tier = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    
    return { 
        walletAddress, 
        score, 
        tier, 
        lastUpdated: new Date().toISOString(),
        factors: [] 
    };
}
```

### Faucet Protection (`src/app/api/faucet/route.ts`)

```typescript
const MINIMUM_FAUCET_SCORE = 40;

const scoreData = await getFairScore(userAddress);
if (scoreData.score < MINIMUM_FAUCET_SCORE) {
    return NextResponse.json({ 
        error: `Trust score too low (${scoreData.score}/100). Minimum ${MINIMUM_FAUCET_SCORE} required.`,
        requiredScore: MINIMUM_FAUCET_SCORE,
        currentScore: scoreData.score
    }, { status: 403 });
}
```

### Trust Score UI (`src/components/security/TrustScore.tsx`)

Circular progress indicator with color-coded tiers:
- **High (70+)** - Green (#10B981)
- **Medium (40-69)** - Orange (#F97316)
- **Low (<40)** - Red (#EF4444)

## 🌐 Live Demo

**Deployed URL:** [https://cadpay.vercel.app/](https://cadpay.vercel.app/)

**Test the Flow:**
1. Create a passkey wallet (works on any WebAuthn device)
2. Check your auto-assigned FairScale mock score
3. Try minting USDC (score ≥40 required)
4. Subscribe to demo services
5. Create savings pots to boost your reputation
6. Access merchant portal to view analytics

## 🏆 Bounty Requirements Met

- ✅ FairScale reputation scoring integrated (mock service)
- ✅ Sybil attack prevention on faucet endpoint
- ✅ Merchant-level trust requirements for services
- ✅ Visual trust score display with tier indicators
- ✅ CadPay reputation boost for savings behavior
- ✅ Mock service ready for live API credentials
- ✅ Clean, well-documented codebase
- ✅ Live demo deployed on Devnet
- ✅ Comprehensive README with usage instructions

## 🔄 Switching to Live FairScale API

When official FairScale credentials arrive, update `src/services/fairscale.ts`:

```typescript
// Replace getMockFairScore implementation
export async function getFairScore(walletAddress: string): Promise<FairScoreResponse> {
    const response = await fetch('https://api.fairscale.io/v1/score', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${process.env.FAIRSCALE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddress })
    });
    
    if (!response.ok) {
        throw new Error(`FairScale API error: ${response.statusText}`);
    }
    
    return response.json();
}
```

Add to `.env.local`:
```env
FAIRSCALE_API_KEY=your_live_api_key_here
```

## 🐛 Troubleshooting

### Build Errors

**Issue:** `Cannot find name 'getAssociatedTokenAddress'`
- **Fix:** Ensure `@solana/spl-token` is version 0.4.9 or higher
- Run: `npm install @solana/spl-token@^0.4.9`

**Issue:** PowerShell execution policy errors (Windows)
- **Fix:** Use: `powershell -ExecutionPolicy Bypass -Command "npm install"`

### Runtime Errors

**Issue:** "Transaction too large" errors
- **Cause:** Smart wallet wrapper instructions + memo exceeding size limit
- **Fix:** Keep memos under 20 characters for savings, 50 for transfers

**Issue:** "Account not found" after creating savings pot
- **Cause:** Transaction confirmation delay
- **Fix:** Wait 2-3 seconds before depositing to new pots

**Issue:** Balance not updating immediately
- **Cause:** RPC propagation delay
- **Fix:** Auto-refresh is enabled; wait 2-3 seconds

## 🐦 Connect

- **Live Demo:** [https://cadpay.vercel.app/](https://cadpay.vercel.app/)
- **GitHub:** [https://github.com/SamuelOluwayomi/solana-subscriptions-starter](https://github.com/SamuelOluwayomi/solana-subscriptions-starter)
- **X Announcement:** [Follow the project](https://x.com/The_devsam/status/2009888166329647558)

## 🙏 Acknowledgments

- **FairScale** for the reputation infrastructure and bounty program
- **Lazorkit** for Account Abstraction SDK and gasless transactions
- **Superteam** for organizing the bounty and supporting Solana builders
- **Solana Foundation** for the high-performance blockchain
- **Anchor** for the smart contract framework

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the FairScale Solana Build Bounty**
