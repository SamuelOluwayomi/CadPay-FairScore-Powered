'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import TrustScore from '@/components/security/TrustScore';

export default function FairScoreSection() {
    return (
        <section className="relative w-full py-24 lg:py-32 bg-black overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

                {/* Text Content */}
                <div className="flex flex-col gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-2"
                    >
                        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <Sparkles className="w-5 h-5 text-orange-500" />
                        </div>
                        <span className="text-sm font-bold text-orange-500 tracking-wider uppercase">Reputation Protocol</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]"
                    >
                        Trusted by <br />
                        <span className="text-zinc-500">the Network.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-zinc-400 max-w-xl leading-relaxed"
                    >
                        FairScore analyzes your on-chain history to build a decentralized reputation profile. A high score unlocks lower collateral requirements, priority support, and <span className="text-white font-semibold">automatic gas sponsorship</span> via our Paymaster.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 gap-4 mt-2"
                    >
                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
                            <div className="text-3xl font-bold text-white mb-1">0%</div>
                            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Gas Fees</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
                            <div className="text-3xl font-bold text-white mb-1">400<span className="text-lg text-zinc-500">ms</span></div>
                            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Settlement</div>
                        </div>
                    </motion.div>
                </div>

                {/* Visual Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="relative flex justify-center lg:justify-end"
                >
                    <div className="relative z-10 w-full max-w-sm">
                        {/* Decorative glow behind the card */}
                        <div className="absolute inset-0 bg-orange-500/20 blur-3xl -z-10 rounded-full transform scale-75" />

                        <div className="transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <TrustScore score={92} compact={false} />
                        </div>

                        {/* Floating Badge */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute -bottom-6 -left-6 bg-zinc-800/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white">Trust Level: HIGH</div>
                                <div className="text-[10px] text-zinc-400">Gasless Transactions Enabled</div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
