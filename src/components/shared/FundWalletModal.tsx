'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CopyIcon, CheckIcon, QrCodeIcon, WalletIcon } from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';

interface FundWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress: string;
}

export default function FundWalletModal({ isOpen, onClose, walletAddress }: FundWalletModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
                                        <QrCodeIcon size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Fund Your Wallet</h2>
                                        <p className="text-xs text-zinc-400">Send SOL or USDC to this address</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                >
                                    <XIcon size={20} />
                                </button>
                            </div>

                            {/* Network Badge */}
                            <div className="mb-6 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <p className="text-sm font-bold text-green-400">Solana Mainnet</p>
                                <p className="text-xs text-green-200/60 ml-1">• Only send Mainnet assets</p>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-white rounded-2xl shadow-lg">
                                    <QRCodeSVG
                                        value={walletAddress || ''}
                                        size={200}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                            </div>

                            {/* Wallet Address */}
                            <div className="mb-4">
                                <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Wallet Address</p>
                                <div className="flex items-center gap-3 p-4 bg-zinc-800/60 border border-white/10 rounded-xl">
                                    <WalletIcon size={18} className="text-zinc-400 shrink-0" />
                                    <span className="font-mono text-sm text-zinc-200 break-all flex-1 leading-relaxed">
                                        {walletAddress}
                                    </span>
                                    <button
                                        onClick={handleCopy}
                                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all text-orange-400"
                                    >
                                        {copied ? <CheckIcon size={18} weight="bold" /> : <CopyIcon size={18} />}
                                    </button>
                                </div>
                                {copied && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-green-400 mt-2 text-center"
                                    >
                                        ✓ Address copied to clipboard!
                                    </motion.p>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl text-xs text-zinc-400 space-y-1.5">
                                <p className="font-bold text-orange-400 mb-1">How to fund:</p>
                                <p>• Scan the QR code with your Solana wallet app</p>
                                <p>• Or copy the address and send directly</p>
                                <p>• USDC deposits will appear in your balance automatically</p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
