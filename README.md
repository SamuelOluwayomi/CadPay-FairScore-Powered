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

- 🔐 **Passkey Wallets** - Biometric login (Face ID, Touch ID, Windows Hello)
- ⚡ **Gasless Transactions** - Lazorkit Paymaster sponsors all fees
- 💳 **Subscription Management** - Netflix, Spotify, and custom services
- 📊 **Merchant Dashboard** - Live transaction tracking with trust requirements
- 🌟 **Jupiter DEX Integration** - Auto-swap subscriptions with best rates

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (React 19)
- **Blockchain:** Solana (Devnet)
- **Reputation:** FairScale API (Mock)
- **Account Abstraction:** Lazorkit SDK v2.0.1
- **Payments:** USDC token transfers
- **Styling:** Tailwind CSS 4

## 📋 Prerequisites

- Node.js 18+ and npm
- Modern browser with WebAuthn support
- Device with biometric authentication

## 🛍️ Merchant Portal
Merchants can manage subscriptions and view analytics.

**Admin Demo Login:**
- **Email:** `demo@cadpay.xyz`
- **Password:** `admin123`
*(This account is pre-populated with live transaction data)*

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/SamuelOluwayomi/solana-subscriptions-starter
cd solana-subscriptions-starter
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_LAZORKIT_APP_ID=your_app_id_here
NEXT_PUBLIC_LAZORKIT_PUBLIC_KEY=your_public_key_here
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Treasury for private faucet
TREASURY_SECRET_KEY=your_treasury_secret_key
```

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

## 🎮 FairScale Integration Demo

### Sybil Guard Flow:
1. **Create Wallet** - Generate passkey-based wallet
2. **Check Trust Score** - FairScale mock service returns deterministic score
3. **Request Funding** - Low-score wallets (< 40) are rejected with clear error
4. **High-Score Success** - Trusted wallets receive 0.05 SOL from private faucet

### Merchant Trust Gates:
1. Navigate to **Merchant Portal**
2. Create new service with "FairScale Trust Gate" toggle
3. Set minimum score requirement (e.g., 50)
4. Users below threshold cannot subscribe

## 📁 FairScale Integration

### Mock Service (`src/services/fairscale.ts`)
```typescript
export async function getMockFairScore(walletAddress: string): Promise<FairScoreResponse> {
    const score = generateMockScore(walletAddress);
    const tier = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    
    return { walletAddress, score, tier, lastUpdated: new Date().toISOString() };
}
```

### Faucet Protection (`src/app/api/faucet/route.ts`)
```typescript
const meetsMinimum = await checkMinimumScore(userAddress, MINIMUM_FAUCET_SCORE);
if (!meetsMinimum) {
    return NextResponse.json({ 
        error: `Trust score too low. Minimum score of ${MINIMUM_FAUCET_SCORE} required.` 
    }, { status: 403 });
}
```

### Trust Score UI (`src/components/security/TrustScore.tsx`)
Circular progress indicator with color-coded tiers:
- **High (70+)** - Green
- **Medium (40-69)** - Orange  
- **Low (<40)** - Red

## 🌐 Live Demo

**Deployed URL:** https://cadpay.vercel.app/

## 🏆 Bounty Requirements Met

- ✅ FairScale reputation scoring integrated
- ✅ Sybil attack prevention on faucet
- ✅ Merchant-level trust requirements
- ✅ Visual trust score display
- ✅ Mock service ready for live credentials
- ✅ Clean, documented codebase
- ✅ Live demo on Devnet

## 🔄 Switching to Live API

When FairScale credentials arrive, update `src/services/fairscale.ts`:

```typescript
export async function getMockFairScore(walletAddress: string): Promise<FairScoreResponse> {
    const response = await fetch('https://api.fairscale.io/v1/score', {
        headers: { 'Authorization': `Bearer ${process.env.FAIRSCALE_API_KEY}` },
        body: JSON.stringify({ walletAddress })
    });
    return response.json();
}
```

## 🐦 Connect

**X:** [Follow the project](https://x.com/The_devsam/status/2009888166329647558)

## 🙏 Acknowledgments

- **FairScale** for the reputation infrastructure
- **Lazorkit** for Account Abstraction SDK
- **Superteam** for organizing the bounty
- **Solana Foundation** for the blockchain
