'use client';

import { motion } from 'framer-motion';
import { TrophyIcon, ShieldCheckIcon, StarIcon, CrownIcon, LightningIcon } from '@phosphor-icons/react';

interface ReputationLevelProps {
    score: number;
}

const LEVELS = [
    { min: 0, name: 'Novice', color: '#71717a', icon: ShieldCheckIcon, perks: ['Basic Access'] },
    { min: 30, name: 'Verified', color: '#3b82f6', icon: StarIcon, perks: ['Gasless Tx', '5% Cashback'] },
    { min: 60, name: 'Trusted', color: '#10b981', icon: TrophyIcon, perks: ['Priority Support', 'Higher Limits'] },
    { min: 80, name: 'Elite', color: '#f59e0b', icon: CrownIcon, perks: ['Exclusive Drops', 'Zero Fees'] },
    { min: 90, name: 'Legend', color: '#8b5cf6', icon: LightningIcon, perks: ['Governance Rights', 'VIP Concierge'] },
];

export default function ReputationLevel({ score }: ReputationLevelProps) {
    const currentLevelIndex = LEVELS.reduce((acc, level, idx) => score >= level.min ? idx : acc, 0);
    const currentLevel = LEVELS[currentLevelIndex];
    const nextLevel = LEVELS[currentLevelIndex + 1];

    const progress = nextLevel
        ? ((score - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
        : 100;

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div
                className="absolute top-0 right-0 w-32 h-32 bg-current opacity-10 blur-3xl rounded-full translate-x-10 -translate-y-10"
                style={{ color: currentLevel.color }}
            />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-1">Reputation Level</h3>
                        <p className="text-xs text-zinc-400">Unlock perks as you grow</p>
                    </div>
                    <div
                        className="p-2 rounded-lg bg-white/5 border border-white/10"
                        style={{ color: currentLevel.color }}
                    >
                        <currentLevel.icon size={24} weight="duotone" />
                    </div>
                </div>

                {/* Level Badge */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl font-black text-white">{currentLevel.name}</div>
                    <div className="px-2 py-0.5 rounded text-[10px] font-bold border bg-white/5" style={{ borderColor: currentLevel.color, color: currentLevel.color }}>
                        LEVEL {currentLevelIndex + 1}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2 flex justify-between text-xs text-zinc-500">
                    <span>{score} Score</span>
                    <span>{nextLevel ? nextLevel.min : 100} Next</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-6">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full relative"
                        style={{ backgroundColor: currentLevel.color }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                </div>

                {/* Perks */}
                <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Current Perks</p>
                    <div className="flex flex-wrap gap-2">
                        {currentLevel.perks.map((perk, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/5 text-xs text-zinc-300">
                                {perk}
                            </span>
                        ))}
                        {nextLevel && (
                            <span className="px-2 py-1 rounded border border-dashed border-zinc-700 text-xs text-zinc-600">
                                + {nextLevel.perks.length} more at {nextLevel.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
