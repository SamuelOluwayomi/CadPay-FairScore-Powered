'use client';

import { motion } from 'framer-motion';
import { LockKeyIcon } from '@phosphor-icons/react';
import { Service } from '@/data/subscriptions';

interface ServiceCardProps {
    service: Service;
    onClick: () => void;
    isLocked?: boolean;
}

export default function ServiceCard({ service, onClick, isLocked = false }: ServiceCardProps) {
    const minPrice = Math.min(...service.plans.map(p => p.price));

    return (
        <motion.div
            whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
            whileTap={!isLocked ? { scale: 0.98 } : {}}
            onClick={!isLocked ? onClick : undefined}
            className={`relative rounded-full p-6 group flex flex-col items-center justify-center text-center aspect-square transition-all duration-300 ${isLocked
                    ? 'bg-zinc-900/40 border-2 border-zinc-800 cursor-not-allowed grayscale opacity-70'
                    : 'bg-zinc-900/80 backdrop-blur-md cursor-pointer'
                }`}
            style={!isLocked ? {
                border: `2px solid ${service.color}40`,
                boxShadow: `0 0 0px ${service.color}00`
            } : {}}
        >
            {/* Color accent - Glow on hover (Only if not locked) */}
            {!isLocked && (
                <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        boxShadow: `0 0 30px ${service.color}30, inset 0 0 20px ${service.color}10`,
                        border: `2px solid ${service.color}`
                    }}
                />
            )}

            {/* Service icon */}
            <div
                className={`relative z-10 text-4xl mb-3 p-3 rounded-full flex items-center justify-center ${isLocked ? 'bg-zinc-800 text-zinc-600' : ''}`}
                style={!isLocked ? { backgroundColor: `${service.color}20`, color: service.color } : {}}
            >
                {isLocked ? <LockKeyIcon size={32} /> : <service.icon size={32} />}
            </div>

            {/* Service info */}
            <div className="relative z-10">
                <h3 className={`text-lg font-bold mb-1 leading-tight ${isLocked ? 'text-zinc-500' : 'text-white'}`}>{service.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 max-w-[140px] mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity">{service.description}</p>

                {/* Price pill */}
                {!isLocked && (
                    <div
                        className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                            backgroundColor: `${service.color}20`,
                            color: service.color
                        }}
                    >
                        ${minPrice === 0 ? 'Free' : minPrice}
                    </div>
                )}

                {isLocked && (
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">
                        Score {(service.minimumTrustScore || 0)}+
                    </div>
                )}
            </div>
        </motion.div>
    );
}
