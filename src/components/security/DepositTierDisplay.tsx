'use client';

import { motion } from 'framer-motion';
import { CoinsIcon, SparkleIcon } from '@phosphor-icons/react';

interface DepositTierDisplayProps {
    tiers: {
        bronze: { count: number; points: number; range: string; color: string };
        silver: { count: number; points: number; range: string; color: string };
        gold: { count: number; points: number; range: string; color: string };
        platinum: { count: number; points: number; range: string; color: string };
    } | null;
}

export default function DepositTierDisplay({ tiers }: DepositTierDisplayProps) {
    if (!tiers) {
        return (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                        <CoinsIcon size={20} className="text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Deposit Tiers</h3>
                        <p className="text-xs text-zinc-500">Earn reputation by saving</p>
                    </div>
                </div>
                <p className="text-xs text-zinc-400">Create a savings pot to start earning tier bonuses!</p>
            </div>
        );
    }

    const tierList = [
        { name: 'Platinum', icon: '💎', ...tiers.platinum, bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
        { name: 'Gold', icon: '🏆', ...tiers.gold, bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
        { name: 'Silver', icon: '🥈', ...tiers.silver, bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/20' },
        { name: 'Bronze', icon: '🥉', ...tiers.bronze, bgColor: 'bg-amber-600/10', borderColor: 'border-amber-600/20' },
    ];

    const activeTiers = tierList.filter(tier => tier.count > 0);
    const totalBonus = tierList.reduce((sum, tier) => sum + (tier.count * tier.points), 0);

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                        <CoinsIcon size={20} className="text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Deposit Tiers</h3>
                        <p className="text-xs text-zinc-500">Earn reputation by saving</p>
                    </div>
                </div>
                {totalBonus > 0 && (
                    <div className="flex items-center gap-1 bg-orange-500/10 px-2.5 py-1 rounded-full">
                        <SparkleIcon size={14} className="text-orange-500" weight="fill" />
                        <span className="text-xs font-bold text-orange-500">+{totalBonus} pts</span>
                    </div>
                )}
            </div>

            {/* Tier List */}
            <div className="space-y-1.5">
                {tierList.map((tier, index) => (
                    <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${tier.count > 0
                            ? `${tier.bgColor} ${tier.borderColor}`
                            : 'bg-zinc-900/20 border-white/5 opacity-50'
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="text-lg">{tier.icon}</span>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-bold ${tier.count > 0 ? 'text-white' : 'text-zinc-600'}`}>
                                        {tier.name}
                                    </span>
                                    {tier.count > 0 && (
                                        <span className="text-xs text-zinc-400">×{tier.count}</span>
                                    )}
                                </div>
                                <span className="text-xs text-zinc-500">{tier.range}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-bold ${tier.count > 0 ? tier.color : 'text-zinc-600'}`}>
                                +{tier.points} pts
                            </div>
                            {tier.count > 0 && (
                                <div className="text-xs text-zinc-500">
                                    = +{tier.points * tier.count}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-zinc-400 text-center">
                    {activeTiers.length > 0
                        ? `You have ${activeTiers.length} active tier${activeTiers.length > 1 ? 's' : ''}!`
                        : 'Deposit to any savings pot to earn tier bonuses'}
                </p>
            </div>
        </div>
    );
}
