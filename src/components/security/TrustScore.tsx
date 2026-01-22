'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@phosphor-icons/react';
import { getMockFairScore, getScoreColor, FairScoreResponse } from '@/services/fairscale';

interface TrustScoreProps {
    walletAddress: string;
    compact?: boolean;
}

export default function TrustScore({ walletAddress, compact = false }: TrustScoreProps) {
    const [scoreData, setScoreData] = useState<FairScoreResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchScore = async () => {
            if (!walletAddress) return;

            setLoading(true);
            try {
                const data = await getMockFairScore(walletAddress);
                if (mounted) {
                    setScoreData(data);
                }
            } catch (error) {
                console.error('Failed to fetch trust score:', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchScore();
        return () => { mounted = false; };
    }, [walletAddress]);

    if (loading) {
        return (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <div className="h-4 bg-zinc-800 rounded w-24 mb-2 animate-pulse" />
                        <div className="h-3 bg-zinc-800 rounded w-32 animate-pulse" />
                    </div>
                    <div className="w-6 h-6 bg-zinc-800 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center justify-center mb-4">
                    <div className="w-32 h-32 bg-zinc-800 rounded-full animate-pulse" />
                </div>
                <div className="flex justify-center">
                    <div className="h-6 bg-zinc-800 rounded-full w-24 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!scoreData) return null;

    const color = getScoreColor(scoreData.score);
    const percentage = scoreData.score;

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-5"
            >
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-zinc-400 font-medium">Trust Score</p>
                    <ShieldCheckIcon size={20} style={{ color }} />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-3xl font-bold text-white mb-1">{scoreData.score}</h3>
                        <p className="text-xs text-zinc-500">Powered by FairScale</p>
                    </div>
                    <div
                        className="px-3 py-1.5 rounded-full text-xs font-bold border"
                        style={{
                            backgroundColor: `${color}20`,
                            borderColor: `${color}40`,
                            color: color
                        }}
                    >
                        {scoreData.tier}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-white mb-1">Trust Score</h3>
                    <p className="text-xs text-zinc-400">Powered by FairScale</p>
                </div>
                <ShieldCheckIcon size={24} style={{ color }} />
            </div>

            <div className="relative flex items-center justify-center mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#27272a"
                        strokeWidth="8"
                        fill="none"
                    />
                    <motion.circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={color}
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 352 }}
                        animate={{ strokeDashoffset: 352 - (352 * percentage) / 100 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                            strokeDasharray: 352,
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-white">{scoreData.score}</span>
                    <span className="text-xs text-zinc-400">/ 100</span>
                </div>
            </div>

            <div className="text-center">
                <div
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold border"
                    style={{
                        backgroundColor: `${color}20`,
                        borderColor: `${color}40`,
                        color: color
                    }}
                >
                    {scoreData.tier} TRUST
                </div>
            </div>
        </div>
    );
}
