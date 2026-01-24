'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    WalletIcon, TrendUpIcon, UsersIcon, LightningIcon, CopyIcon, CheckIcon, StorefrontIcon,
    ReceiptIcon, ChartPieIcon, KeyIcon, ShieldCheckIcon, CaretRightIcon, ArrowLeftIcon,
    EyeIcon, EyeSlashIcon, PlusIcon, XIcon, ListIcon, ArrowsClockwise as ArrowsClockwiseIcon,
    Cards as CardsIcon, ArrowSquareOut
} from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added Router
import { Connection, PublicKey } from '@solana/web3.js';
import { CADPAY_MINT } from '@/utils/cadpayToken';
import { useMerchant } from '@/context/MerchantContext'; // Added Context

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SERVICES } from '@/data/subscriptions';


export default function MerchantDashboard() {
    const { merchant, createNewService, logoutMerchant, isLoading } = useMerchant();
    const router = useRouter();

    // Create Service Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false); // Added loading state for creation
    const [newServiceName, setNewServiceName] = useState('');

    // State for Metrics & Data
    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [txCount, setTxCount] = useState(0);
    const [mrr, setMrr] = useState(0);
    const [gasSaved, setGasSaved] = useState(0);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showKey, setShowKey] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const seenPayers = useRef(new Set<string>());

    // FairScale Trust Scores for customers
    const [customerScores, setCustomerScores] = useState<Map<string, number>>(new Map());
    const [loadingScores, setLoadingScores] = useState<Set<string>>(new Set());

    const [newServicePrice, setNewServicePrice] = useState(19.99);
    const [newServiceColor, setNewServiceColor] = useState('#EF4444');
    const [requireTrustScore, setRequireTrustScore] = useState(false);
    const [minimumTrustScore, setMinimumTrustScore] = useState(50);


    // Navigation state
    const [activeSection, setActiveSection] = useState<'dashboard' | 'analytics' | 'customers' | 'invoices' | 'developer'>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Protect Route - redirect to signin if not logged in (only after loading completes)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isLoading && !merchant) {
                router.push('/merchant-auth');
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [merchant, isLoading, router]);

    // Handle sidebar default state based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true); // Open sidebar on desktop by default
            } else {
                setSidebarOpen(false); // Close on mobile
            }
        };

        // Set initial state
        handleResize();

        // Listen for window resize
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate Base Logic & Fetch Ledger
    // Calculate Base Logic & Fetch Ledger
    // useEffect(() => {
    // if (!merchant) return;

    // 2. Initialize with Empty Data (Real fetching)
    let initialChartData: any[] = [
        { name: 'No Data', value: 100, color: '#27272a' }
    ];

    // Use custom RPC URL from environment (fallback to public devnet)

    const envRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    let rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';

    // Use env RPC if it exists and isn't a flaky Helius one
    if (envRpc && !envRpc.includes('helius')) {
        rpcUrl = envRpc;
    }

    const connection = new Connection(rpcUrl, 'confirmed');
    // const merchantKey = new PublicKey(merchant.walletPublicKey); // Unused here, kept for ref

    const fetchHistory = useCallback(async () => {
        if (!merchant) return;

        // RESET Metrics to prevent accumulation on re-fetch
        setTotalRevenue(0);
        setMrr(0);
        setGasSaved(0);
        setTxCount(0);
        seenPayers.current.clear();

        try {
            // Use specific Token Account for Demo, otherwise User Wallet
            // Use specific Token Account for Demo, otherwise derive ATA
            const demoEmails = ['demo@cadpay.xyz', 'admin@gmail.com', 'onchain@cadpay.xyz'];
            const isDemo = demoEmails.includes(merchant.email);

            let accountToFetch = isDemo
                ? new PublicKey('EjHw3nsXgJeLwZU5uBD4tbcb2mTZ9rZpFQEeYLwWjJwP')
                : new PublicKey(merchant.walletPublicKey);

            // Dynamically find the USDC ATA for regular merchants
            if (!isDemo) {
                try {
                    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                        new PublicKey(merchant.walletPublicKey),
                        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') } // Token Program
                    );

                    // Look for USDC Devnet Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
                    const usdcMint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
                    const usdcAccount = tokenAccounts.value.find((t: any) => t.account.data.parsed.info.mint === usdcMint);

                    if (usdcAccount) {
                        accountToFetch = new PublicKey(usdcAccount.pubkey);
                    } else if (tokenAccounts.value.length > 0) {
                        // Fallback to first found token account if USDC not found
                        accountToFetch = new PublicKey(tokenAccounts.value[0].pubkey);
                    }
                } catch (e) {
                    // Fallback to wallet is automatic since accountToFetch was initialized to walletPublicKey
                }
            }

            let signatures;
            try {
                signatures = await connection.getSignaturesForAddress(accountToFetch, { limit: 100 });
            } catch (rpcError) {
                console.log('RPC fetch failed, using empty data:', rpcError);
                setTransactions([]);
                setLoading(false);
                return;
            }

            if (signatures.length === 0) {
                setTransactions([]);
                setChartData(initialChartData);
                setLoading(false);
                return;
            }

            // 1. IMPROVEMENT: Show skeletons/placeholders immediately
            const placeholders = signatures.map(s => ({
                id: s.signature,
                customer: 'Loading...',
                amount: 0,
                memo: 'Scanning...',
                date: s.blockTime ? new Date(s.blockTime * 1000).toLocaleString() : 'Pending',
                status: 'loading',
                service: { name: '...', color: '#27272a' }
            }));
            setTransactions(placeholders);
            setLoading(false); // Unblock UI immediately

            const txIds = signatures.map(s => s.signature);
            const txMap = new Map();

            // Helius free tier / Public RPC rate limit handling
            // Fetch incrementally and update UI per transaction or in small batches
            for (let i = 0; i < txIds.length; i++) {
                const sig = txIds[i];
                try {
                    // Support Versioned Transactions
                    const single: any = await connection.getParsedTransaction(sig, {
                        commitment: 'confirmed',
                        maxSupportedTransactionVersion: 0
                    });

                    if (single) {
                        txMap.set(sig, single);

                        // Process SINGLE transaction immediately for UI update
                        const tx = single;
                        let amount = 0;
                        let memoText = '';

                        // --- MEMO & AMOUNT LOGIC START ---
                        const checkInstructionForMemo = (instr: any) => {
                            let extracted = '';
                            if (instr.parsed?.type === 'memo' && instr.parsed?.info?.memo) {
                                extracted = instr.parsed.info.memo;
                            }
                            if (!extracted && instr.programId) {
                                const programId = typeof instr.programId === 'string'
                                    ? instr.programId
                                    : instr.programId.toBase58?.() || String(instr.programId);

                                if (programId === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr' ||
                                    programId === 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo') {
                                    if (instr.data) {
                                        try {
                                            const decoded = typeof instr.data === 'string'
                                                ? Buffer.from(instr.data, 'base64').toString('utf-8')
                                                : instr.data;
                                            extracted = decoded;
                                        } catch (e) { }
                                    }
                                }
                            }
                            return extracted;
                        };

                        const checkInstructionForTransfer = (instr: any) => {
                            let val = 0;
                            if (instr.parsed?.type === 'mintTo' && instr.parsed?.info?.amount) { // Treat mints as revenue for demo
                                val = Number(BigInt(instr.parsed.info.amount)) / 1_000_000;
                            }
                            if ((instr.parsed?.type === 'transfer' || instr.parsed?.type === 'transferChecked') && instr.parsed?.info?.tokenAmount?.uiAmount) {
                                val = instr.parsed.info.tokenAmount.uiAmount;
                            }
                            return val;
                        };

                        // 1. Top Level Instructions
                        if (tx?.transaction?.message?.instructions) {
                            for (const instr of tx.transaction.message.instructions) {
                                const found = checkInstructionForMemo(instr);
                                if (found) memoText = found;
                                amount += checkInstructionForTransfer(instr);
                            }
                        }

                        // 2. Inner Instructions (Critical for SPL via programs)
                        if (tx?.meta?.innerInstructions) {
                            for (const innerSet of tx.meta.innerInstructions) {
                                for (const instr of innerSet.instructions) {
                                    const found = checkInstructionForMemo(instr);
                                    if (found && !memoText) memoText = found;
                                    const val = checkInstructionForTransfer(instr);
                                    if (val > 0) amount = val; // Prioritize inner transfer if found (often the real movement)
                                }
                            }
                        }

                        // 3. Log Parsing for Memo (Fallback)
                        if (!memoText && tx?.meta?.logMessages) {
                            const logs = tx.meta.logMessages;
                            for (const log of logs) {
                                const match = log.match(/Memo \(len \d+\): "(.*?)"/);
                                if (match && match[1]) { memoText = match[1]; break; }
                            }
                        }

                        // 4. Fallback Balance Logic (If parsed instructions failed)
                        if (amount === 0) {
                            const preBalances = tx?.meta?.preTokenBalances || [];
                            const postBalances = tx?.meta?.postTokenBalances || [];
                            if (postBalances.length > 0) {
                                for (const p of postBalances) {
                                    const postAmt = p?.uiTokenAmount?.uiAmount || 0;
                                    const preMatch = preBalances.find((q: any) => q.accountIndex === p.accountIndex);
                                    const preAmt = preMatch?.uiTokenAmount?.uiAmount || 0;
                                    if (postAmt - preAmt > 0) {
                                        amount = postAmt - preAmt;
                                        break; // Assume first positive change is the payment
                                    }
                                    // New account funding
                                    if (!preMatch && postAmt > 0) { amount = postAmt; break; }
                                }
                            }
                        }
                        // --- MEMO & AMOUNT LOGIC END ---

                        // Hash for random deterministic color
                        const getColorForService = (name: string) => {
                            let hash = 0;
                            for (let j = 0; j < name.length; j++) {
                                hash = name.charCodeAt(j) + ((hash << 5) - hash);
                            }
                            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
                            return '#' + '00000'.substring(0, 6 - c.length) + c;
                        };

                        const finalColor = getColorForService(memoText || 'Subscription');

                        // Extract Payer (First account is fee payer/signer)
                        const accountKeys = tx.transaction.message.accountKeys;
                        const payerKey = accountKeys[0]?.pubkey?.toBase58 ? accountKeys[0].pubkey.toBase58() :
                            accountKeys[0]?.pubkey ? String(accountKeys[0].pubkey) :
                                (typeof accountKeys[0] === 'string' ? accountKeys[0] : 'Unknown');

                        // Fetch FairScale trust score for customer
                        if (payerKey && payerKey !== 'Unknown' && !customerScores.has(payerKey) && !loadingScores.has(payerKey)) {
                            setLoadingScores(prev => new Set([...prev, payerKey]));

                            // Define deterministic score generator
                            const getMockScore = (pk: string) => {
                                let hash = 0;
                                for (let i = 0; i < pk.length; i++) hash = pk.charCodeAt(i) + ((hash << 5) - hash);
                                return 60 + (Math.abs(hash) % 39); // Score between 60-99
                            };

                            fetch(`/api/fairscale/score?walletAddress=${payerKey}`)
                                .then(res => res.json())
                                .then(data => {
                                    // Use data.score if available, otherwise mock it for demo
                                    const finalScore = data.score && data.score > 0 ? data.score : getMockScore(payerKey);
                                    setCustomerScores(prev => new Map(prev).set(payerKey, finalScore));
                                    setLoadingScores(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(payerKey);
                                        return newSet;
                                    });
                                })
                                .catch(() => {
                                    // Mock on error
                                    setCustomerScores(prev => new Map(prev).set(payerKey, getMockScore(payerKey)));
                                    setLoadingScores(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(payerKey);
                                        return newSet;
                                    });
                                });
                        }

                        // Update State for this specific transaction
                        setTransactions(prev => prev.map(item => {
                            if (item.id === sig) {
                                return {
                                    ...item,
                                    customer: payerKey.slice(0, 4) + '...' + payerKey.slice(-4),
                                    customerFull: payerKey,
                                    amount: amount,
                                    memo: memoText,
                                    status: 'success',
                                    service: {
                                        name: memoText || 'Subscription',
                                        color: finalColor
                                    }
                                };
                            }
                            return item;
                        }));

                        // Update Metrics Incrementally
                        if (amount > 0) {
                            const realRevenue = amount;
                            setTotalRevenue(prev => prev + realRevenue);
                            setMrr(prev => prev + realRevenue);

                            // Ensure unique customer count
                            if (!seenPayers.current.has(payerKey)) {
                                seenPayers.current.add(payerKey);
                                setTxCount(prev => prev + 1);
                            }

                            setGasSaved(prev => prev + 0.000005);

                            // Update Chart Incrementally
                            setChartData(prevData => {
                                const sName = memoText || 'Subscription';
                                // Remove 'No Data' if it exists
                                const cleanData = prevData.filter(d => d.name !== 'No Data');

                                const existingIndex = cleanData.findIndex(d => d.name === sName);
                                const newD = [...cleanData];
                                if (existingIndex >= 0) {
                                    newD[existingIndex] = { ...newD[existingIndex], value: newD[existingIndex].value + amount };
                                } else {
                                    newD.push({ name: sName, value: amount, color: finalColor });
                                }
                                return newD;
                            });
                        }
                    }
                } catch (singleError) {
                    console.log(`Failed to fetch tx ${sig}`, singleError);
                }

                // small delay to reduce burst rate (reduced to 10ms)
                if (i + 1 < txIds.length) await new Promise(resolve => setTimeout(resolve, 10));
            }
            // End of loop

        } catch (error) {
            console.error("Error fetching merchant history:", error);
            setLoading(false);
        }
    }, [merchant?.walletPublicKey]);

    useEffect(() => {
        if (!merchant?.walletPublicKey) return;

        fetchHistory();

        // Refresh every 60 seconds (increased from 30s to avoid rate limits)
        const interval = setInterval(fetchHistory, 60000);
        return () => clearInterval(interval);
    }, [merchant?.walletPublicKey, fetchHistory]);

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCreateService = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        // Simulate network delay or await actual creation if async
        await new Promise(resolve => setTimeout(resolve, 1000));
        createNewService(
            newServiceName,
            newServicePrice,
            "Monthly Subscription",
            newServiceColor,
            requireTrustScore ? minimumTrustScore : undefined
        );
        setIsCreating(false);
        setIsCreateModalOpen(false);
        setNewServiceName('');
        setNewServicePrice(19.99);
        setRequireTrustScore(false);
        setMinimumTrustScore(50);
    };

    const handleNavClick = (section: any) => {
        setActiveSection(section);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm">Loading Merchant Portal...</p>
                </div>
            </div>
        );
    }

    if (!merchant) return null; // Logic in Layout should handle redirect, but just in case

    return (
        <div className="flex min-h-screen bg-black text-white font-sans selection:bg-orange-500/30 pt-16">
            {/* Mobile/Desktop Hamburger Menu Toggle */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 z-50 w-12 h-12 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-zinc-800 transition-colors shadow-lg"
                    title="Open Menu"
                >
                    <ListIcon size={24} />
                </button>
            )}

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    />
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="w-64 border-r border-white/10 bg-zinc-900/50 flex flex-col fixed inset-y-0 z-40 backdrop-blur-xl"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <Link href="/" className="group flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-500 text-black flex items-center justify-center rounded-lg shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform font-black text-xl not-italic">
                                        C
                                    </div>
                                    <span className="text-xl font-black bg-white text-transparent bg-clip-text">
                                        CadPay
                                    </span>
                                </Link>
                                <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                                    <XIcon size={24} />
                                </button>
                            </div>

                            <nav className="space-y-1">
                                <NavItem
                                    icon={<StorefrontIcon size={20} />}
                                    label="Dashboard"
                                    active={activeSection === 'dashboard'}
                                    onClick={() => handleNavClick('dashboard')}
                                />
                                <NavItem
                                    icon={<ChartPieIcon size={20} />}
                                    label="Analytics"
                                    active={activeSection === 'analytics'}
                                    onClick={() => handleNavClick('analytics')}
                                />
                                <NavItem
                                    icon={<UsersIcon size={20} />}
                                    label="Customers"
                                    active={activeSection === 'customers'}
                                    onClick={() => handleNavClick('customers')}
                                />
                                <NavItem
                                    icon={<ReceiptIcon size={20} />}
                                    label="Invoices"
                                    active={activeSection === 'invoices'}
                                    onClick={() => handleNavClick('invoices')}
                                />
                                <NavItem
                                    icon={<KeyIcon size={20} />}
                                    label="Developer"
                                    active={activeSection === 'developer'}
                                    onClick={() => handleNavClick('developer')}
                                />
                            </nav>
                        </div>

                        <div className="mt-auto p-6 border-t border-white/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-black border-2 border-white/10">
                                    {merchant.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{merchant.name}</p>
                                    <p className="text-xs text-zinc-400 truncate">{merchant.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    logoutMerchant();
                                    router.push('/merchant-auth');
                                }}
                                className="w-full py-2 text-xs text-zinc-500 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT */}
            <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 md:p-8 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                {!merchant ? (
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-zinc-500">Loading...</div>
                    </div>
                ) : (
                    <>
                        <header className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                                <p className="text-zinc-400">Welcome back, here's what's happening with {merchant.name} today.</p>
                            </div>
                        </header>

                        {/* 1. NORTH STAR METRICS */}
                        {['dashboard', 'analytics'].includes(activeSection) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                                <MetricCard
                                    title="Total Revenue"
                                    value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    trend={merchant.email === 'admin@gmail.com' ? "+12%" : "+0%"}
                                    icon={<TrendUpIcon size={24} className="text-green-400" />}
                                    color="green"
                                />
                                <MetricCard
                                    title="Total Customers"
                                    value={txCount.toLocaleString()}
                                    trend={merchant.email === 'admin@gmail.com' ? "+42 new" : "+0 new"}
                                    icon={<UsersIcon size={24} className="text-blue-400" />}
                                    color="blue"
                                />
                                <MetricCard
                                    title="Monthly Recurring (MRR)"
                                    value={`$${mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    trend={merchant.email === 'admin@gmail.com' ? "+8%" : "+0%"}
                                    icon={<ReceiptIcon size={24} className="text-purple-400" />}
                                    color="purple"
                                />
                                <MetricCard
                                    title="Gas Subsidized (The Flex)"
                                    value={`${gasSaved.toFixed(4)} SOL`}
                                    trend="100% Covered"
                                    icon={<LightningIcon size={24} className="text-orange-400 fill-orange-400" />}
                                    color="orange"
                                    subtext="You saved users this much!"
                                />
                            </div>
                        )}

                        <div className="grid lg:grid-cols-3 gap-8 mb-8">
                            {/* 2. REVENUE SPLIT CHART */}
                            {['dashboard', 'analytics'].includes(activeSection) && (
                                <div className="lg:col-span-1 bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-white">Revenue Split</h3>
                                        <button className="text-zinc-500 hover:text-white"><ChartPieIcon size={20} /></button>
                                    </div>

                                    <div className="h-80 w-full relative min-w-0">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: any) => `$${value?.toLocaleString()}`}
                                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center Text */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center">
                                                <span className="block text-zinc-500 text-xs">Total</span>
                                                <span className="block text-xl font-bold text-white">
                                                    ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-center text-zinc-500 text-sm">Revenue distribution across your active products.</p>
                                    </div>
                                </div>
                            )}

                            {/* 3. FAIRSCALE ANALYTICS (DASHBOARD WIDGET) */}
                            {['dashboard', 'analytics'].includes(activeSection) && (
                                <div className="lg:col-span-2 bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <ShieldCheckIcon size={20} className="text-green-500" />
                                        FairScale Trust Analysis
                                    </h3>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <CustomerMetricCard
                                                    title="Avg Score"
                                                    value={transactions.length > 0 ? "72" : "-"}
                                                    subtext="High Trust"
                                                />
                                                <CustomerMetricCard
                                                    title="At Risk"
                                                    value={transactions.length > 0 ? "2" : "-"}
                                                    subtext="Needs Review"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-zinc-400">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" /> High Trust (70+)
                                                </span>
                                                <span className="font-bold">65%</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                                <div className="bg-green-500 h-full rounded-full" style={{ width: '65%' }} />
                                            </div>

                                            <div className="flex items-center justify-between text-sm pt-2">
                                                <span className="flex items-center gap-2 text-zinc-400">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500" /> Medium Trust
                                                </span>
                                                <span className="font-bold">25%</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                                <div className="bg-orange-500 h-full rounded-full" style={{ width: '25%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* 4. CUSTOMER ANALYTICS (FAIRSCALE) */}
                            {activeSection === 'customers' && (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                                    {/* Trust Score Distribution */}
                                    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                            <ShieldCheckIcon size={20} className="text-green-500" />
                                            Trust Score Distribution
                                        </h3>

                                        <div className="grid grid-cols-1 gap-4 mb-6">
                                            <CustomerMetricCard
                                                title="Avg Score"
                                                value={transactions.length > 0 ? "72" : "-"}
                                                subtext="Active customers"
                                            />
                                            <CustomerMetricCard
                                                title="At Risk"
                                                value={transactions.length > 0 ? "2" : "-"}
                                                subtext="Needs review"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-zinc-400">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" /> High Trust (70+)
                                                </span>
                                                <span className="font-bold">65%</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                                <div className="bg-green-500 h-full rounded-full" style={{ width: '65%' }} />
                                            </div>

                                            <div className="flex items-center justify-between text-sm pt-2">
                                                <span className="flex items-center gap-2 text-zinc-400">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500" /> Medium Trust (40-69)
                                                </span>
                                                <span className="font-bold">25%</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                                <div className="bg-orange-500 h-full rounded-full" style={{ width: '25%' }} />
                                            </div>

                                            <div className="flex items-center justify-between text-sm pt-2">
                                                <span className="flex items-center gap-2 text-zinc-400">
                                                    <div className="w-2 h-2 rounded-full bg-red-500" /> Low Trust (&lt;40)
                                                </span>
                                                <span className="font-bold">10%</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                                <div className="bg-red-500 h-full rounded-full" style={{ width: '10%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Trusted Customers */}
                                    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                            <CardsIcon size={20} className="text-blue-500" />
                                            Top Trusted Customers
                                        </h3>

                                        <div className="space-y-3">
                                            {Array.from(customerScores.entries())
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 5)
                                                .map(([address, score], i) => (
                                                    <div key={address} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                                                                #{i + 1}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-mono text-zinc-300">{address.slice(0, 4)}...{address.slice(-4)}</p>
                                                                <p className="text-xs text-zinc-500">Last active: Recently</p>
                                                            </div>
                                                        </div>
                                                        <TrustScoreBadge walletAddress={address} score={score} loading={false} />
                                                    </div>
                                                ))}

                                            {customerScores.size === 0 && (
                                                <div className="text-center py-8 text-zinc-500 text-sm">
                                                    No customer data with trust scores yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. LIVE LEDGER */}
                            {['dashboard', 'customers'].includes(activeSection) && (
                                <div className="lg:col-span-3 bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-xl font-bold text-white">Live Ledger</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-full border border-green-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live Feed</span>
                                                </span>
                                                <button
                                                    onClick={fetchHistory}
                                                    disabled={loading}
                                                    className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                                    title="Refresh Transactions"
                                                >
                                                    <ArrowsClockwiseIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                                </button>

                                                <a
                                                    href={`https://explorer.solana.com/address/${merchant.walletPublicKey}?cluster=devnet`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
                                                >
                                                    <span className="hidden sm:inline">View on Network</span>
                                                    <span className="sm:hidden">Explorer</span>
                                                    <ArrowSquareOut size={14} />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500 font-mono">{merchant.walletPublicKey.slice(0, 4)}...{merchant.walletPublicKey.slice(-4)}</span>
                                            <CopyIcon size={14} className="text-zinc-500 cursor-pointer hover:text-white" />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto flex-1">
                                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                            <thead>
                                                <tr className="text-xs text-zinc-500 uppercase tracking-wider border-b border-white/5">
                                                    <th className="pb-3 pl-2 font-medium">Status</th>
                                                    <th className="pb-3 font-medium hidden lg:table-cell">Product</th>
                                                    <th className="pb-3 font-medium hidden md:table-cell">Customer</th>
                                                    <th className="pb-3 font-medium">TX ID</th>
                                                    <th className="pb-3 text-center font-medium hidden xl:table-cell">Trust Score</th>
                                                    <th className="pb-3 text-right font-medium pr-2">Service</th>
                                                    <th className="pb-3 text-right font-medium pr-2 hidden lg:table-cell">Gas Fee</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm divide-y divide-white/5">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-8 text-center text-zinc-500">Scanning Solana Blockchain...</td>
                                                    </tr>
                                                ) : transactions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-12 text-center text-zinc-700">
                                                            No transactions yet. Create a product and share the link!
                                                        </td>
                                                    </tr>
                                                ) : transactions.slice(0, 10).map((tx, i) => (
                                                    <motion.tr
                                                        key={tx.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="group hover:bg-white/5 transition-colors"
                                                    >
                                                        <td className="py-3 pl-2">
                                                            <div className="flex items-center gap-2">
                                                                <CheckIcon size={14} className="text-green-500 font-bold" />
                                                                <span className='text-green-400 hidden sm:inline'>Success</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 hidden lg:table-cell">
                                                            <span className="font-medium text-zinc-200">Subscription</span>
                                                        </td>
                                                        <td className="py-3 font-mono text-xs text-zinc-400 hidden md:table-cell">
                                                            {tx.customer}
                                                        </td>
                                                        <td className="py-3 px-1">
                                                            <div className="flex items-center gap-1 relative">
                                                                <span className="font-mono text-[10px] sm:text-xs text-zinc-400 truncate max-w-15 sm:max-w-25">
                                                                    {tx.id.slice(0, 4)}...{tx.id.slice(-4)}
                                                                </span>
                                                                <button
                                                                    onClick={() => copyToClipboard(tx.id, tx.id)}
                                                                    className="text-zinc-500 hover:text-white transition-colors relative shrink-0"
                                                                >
                                                                    {copiedId === tx.id ?
                                                                        <CheckIcon size={12} className="text-green-400" /> :
                                                                        <CopyIcon size={12} />
                                                                    }
                                                                </button>
                                                                {copiedId === tx.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 5 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0 }}
                                                                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                                                                    >
                                                                        Copied!
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2 text-center hidden xl:table-cell">
                                                            <TrustScoreBadge
                                                                walletAddress={tx.customer.includes('...') ? transactions[i].customerFull : tx.customer}
                                                                score={customerScores.get(transactions[i].customerFull)}
                                                                loading={loadingScores.has(transactions[i].customerFull)}
                                                            />
                                                        </td>
                                                        <td className="py-3 pr-2 text-right font-bold text-white text-[10px] sm:text-xs">
                                                            {tx.memo || 'Subscription'}
                                                        </td>
                                                        <td className="py-3 pr-2 text-right hidden lg:table-cell">
                                                            <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                                                0.00 SOL
                                                            </span>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. PRODUCT STUDIO & DEV KEYS */}
                        {['dashboard', 'developer'].includes(activeSection) && (
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Products */}
                                {activeSection === 'dashboard' && (
                                    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-white">Active Plans</h3>
                                            <button
                                                onClick={() => setIsCreateModalOpen(true)}
                                                className="text-xs font-bold bg-white text-black px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1"
                                            >
                                                <PlusIcon size={14} /> Create Payment Link
                                            </button>
                                        </div>

                                        {/* Empty State or List */}
                                        <div className="space-y-4">
                                            <div className="p-8 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center">
                                                <div className="p-3 bg-zinc-800 rounded-full mb-3 text-zinc-400">
                                                    <StorefrontIcon size={24} />
                                                </div>
                                                <p className="text-sm font-medium text-zinc-300">No active plans</p>
                                                <p className="text-xs text-zinc-500 mb-3">Create your first subscription tier</p>
                                                <button onClick={() => setIsCreateModalOpen(true)} className="text-orange-500 text-xs font-bold hover:underline">Create Now</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Developer Keys */}
                                {activeSection === 'developer' && (
                                    <div className="md:col-span-2 bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden">
                                        <div className="flex items-center gap-3 mb-6 relative z-10">
                                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                <KeyIcon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">Developer API Keys</h3>
                                                <p className="text-xs text-zinc-400">Manage your integration secrets</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div>
                                                <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider mb-2 block">Publishable Key</label>
                                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-3">
                                                    <code className="text-sm font-mono text-zinc-300">{merchant.walletPublicKey}</code>
                                                    <CopyIcon size={16} className="text-zinc-500 cursor-pointer hover:text-white" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider mb-2 block">Secret Key</label>
                                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-3">
                                                    <code className="text-sm font-mono text-zinc-300">
                                                        {showKey ? merchant.walletSecretKey : 'sk_live_•••••••••••••••••••••'}
                                                    </code>
                                                    <button onClick={() => setShowKey(!showKey)} className="text-zinc-500 cursor-pointer hover:text-white">
                                                        {showKey ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-orange-500/80 mt-2 flex items-center gap-1.5">
                                                    <ShieldCheckIcon size={14} /> Never share your secret key client-side.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Background Effect */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection === 'invoices' && (
                            <div className="flex flex-col items-center justify-center p-12 lg:p-24 border-2 border-dashed border-zinc-800 rounded-3xl text-center bg-zinc-900/20">
                                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6 text-zinc-500">
                                    <ReceiptIcon size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Invoices Coming Soon</h2>
                                <p className="text-zinc-400 max-w-md">Streamline your billing with professional, on-chain invoices. This feature is currently under development.</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Create Service Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">New Subscription Plan</h3>
                                <button onClick={() => setIsCreateModalOpen(false)}><XIcon size={20} className="text-zinc-400 hover:text-white" /></button>
                            </div>

                            <form onSubmit={handleCreateService} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Service Name</label>
                                    <input
                                        type="text" value={newServiceName} onChange={e => setNewServiceName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                                        placeholder="e.g. Premium Plan"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Price (USDC)</label>
                                    <input
                                        type="number" step="0.01" value={newServicePrice} onChange={e => setNewServicePrice(parseFloat(e.target.value))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Brand Color</label>
                                    <div className="flex gap-2">
                                        {['#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'].map(color => (
                                            <div
                                                key={color}
                                                onClick={() => setNewServiceColor(color)}
                                                className={`w-8 h-8 rounded-full cursor-pointer border-2 ${newServiceColor === color ? 'border-white' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-400 uppercase">FairScale Trust Gate</label>
                                            <p className="text-xs text-zinc-500 mt-1">Require minimum trust score</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setRequireTrustScore(!requireTrustScore)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${requireTrustScore ? 'bg-orange-500' : 'bg-zinc-700'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${requireTrustScore ? 'translate-x-6' : ''}`} />
                                        </button>
                                    </div>
                                    {requireTrustScore && (
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Minimum Score</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={minimumTrustScore}
                                                onChange={e => setMinimumTrustScore(parseInt(e.target.value))}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-colors mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Plan'
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


function NavItem({ icon, label, active, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active
                ? 'bg-white text-black font-bold shadow-lg'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            <span className="text-sm">{label}</span>
        </div>
    );
}

function TrustScoreBadge({ walletAddress, score, loading }: { walletAddress?: string, score?: number, loading?: boolean }) {
    if (loading) {
        return <div className="h-5 w-16 bg-zinc-800 rounded animate-pulse mx-auto" />;
    }

    if (score === undefined) {
        return <span className="text-xs text-zinc-500">-</span>;
    }

    let colorClass = 'bg-zinc-800 text-zinc-400 border-zinc-700'; // Default/Low
    if (score >= 70) colorClass = 'bg-green-500/10 text-green-400 border-green-500/20';
    else if (score >= 40) colorClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    else colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';

    return (
        <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}>
            {score}/100
        </div>
    );
}

function CustomerMetricCard({ title, value, subtext }: { title: string, value: string, subtext: string }) {
    return (
        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1 whitespace-nowrap">{title}</p>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-zinc-500 text-xs truncate" title={subtext}>{subtext}</p>
        </div>
    );
}

function MetricCard({ title, value, trend, icon, color, subtext }: { title: string, value: string, trend: string, icon: any, color: 'green' | 'blue' | 'purple' | 'orange', subtext?: string }) {
    const colors: Record<string, string> = {
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    };

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
                <span className="text-xs font-medium bg-white/5 px-2 py-1 rounded-full text-zinc-400">
                    {trend}
                </span>
            </div>
            <div>
                <p className="text-zinc-500 text-xs font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white">{value}</h3>
                {subtext && <p className="text-xs text-zinc-500 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}
