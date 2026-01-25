import { useEffect, useState, useMemo } from 'react';
import { useWallet } from '@lazorkit/wallet';
import * as anchor from '@coral-xyz/anchor';
import { Program, Idl } from '@coral-xyz/anchor';

// Use anchor.web3 instead of root web3 to avoid 'instanceof' / version mismatch errors
const { Connection, PublicKey, SystemProgram, Transaction } = anchor.web3;

const PROGRAM_ID_STR = "6VvJbGzNHbtZLWxmLTYPpRz2F3oMDxdL1YRgV3b51Ccz";
const DEVNET_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';

const IDL: Idl = {
    "version": "0.1.0",
    "name": "cadpay_profiles",
    "address": PROGRAM_ID_STR,
    "instructions": [
        {
            "name": "initialize_user",
            "discriminator": [111, 17, 185, 250, 60, 122, 38, 254],
            "accounts": [
                { "name": "userProfile", "writable": true, "signer": false },
                { "name": "user", "writable": true, "signer": true },
                { "name": "systemProgram", "writable": false, "signer": false }
            ],
            "args": [
                { "name": "username", "type": { "array": ["u8", 16] } },
                { "name": "emoji", "type": { "array": ["u8", 4] } },
                { "name": "gender", "type": { "array": ["u8", 8] } },
                { "name": "pin", "type": { "array": ["u8", 4] } }
            ]
        },
        {
            "name": "update_user",
            "discriminator": [9, 2, 160, 169, 118, 12, 207, 84],
            "accounts": [
                { "name": "userProfile", "writable": true, "signer": false },
                { "name": "user", "writable": false, "signer": true },
                { "name": "authority", "writable": false, "signer": true }
            ],
            "args": [
                { "name": "username", "type": { "array": ["u8", 16] } },
                { "name": "emoji", "type": { "array": ["u8", 4] } },
                { "name": "gender", "type": { "array": ["u8", 8] } },
                { "name": "pin", "type": { "array": ["u8", 4] } }
            ]
        }
    ],
    "accounts": [
        {
            "name": "UserProfile",
            "discriminator": [32, 37, 119, 205, 179, 180, 13, 194]
        }
    ],
    "types": [
        {
            "name": "UserProfile",
            "type": {
                "kind": "struct",
                "fields": [
                    { "name": "authority", "type": "pubkey" },
                    { "name": "username", "type": { "array": ["u8", 16] } },
                    { "name": "emoji", "type": { "array": ["u8", 4] } },
                    { "name": "gender", "type": { "array": ["u8", 8] } },
                    { "name": "pin", "type": { "array": ["u8", 4] } }
                ]
            }
        }
    ]
} as any;

export interface UserProfile {
    username: string;
    emoji: string;
    gender: string;
    pin: string;
    authority: anchor.web3.PublicKey;
}

export function useUserProfile() {
    // @ts-ignore
    const { smartWalletPubkey, signAndSendTransaction, connection: lazorkitConnection } = useWallet();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true); // Start as true to prevent flicker
    const [error, setError] = useState<string | null>(null);

    // Initial persistence sync
    useEffect(() => {
        if (smartWalletPubkey) {
            const saved = localStorage.getItem(`cadpay_profile_exists_${smartWalletPubkey.toString()}`);
            if (saved === 'true') {
                // We strongly suspect a profile exists, stay in loading state until fetch confirms it
                setLoading(true);
            } else {
                // No local record, but we still need to check once
                setLoading(true);
            }
        } else {
            setLoading(false);
            setProfile(null);
        }
    }, [smartWalletPubkey?.toString()]);

    const connection = useMemo(() => {
        if (lazorkitConnection) return lazorkitConnection;
        return new Connection(DEVNET_RPC, 'confirmed');
    }, [lazorkitConnection?.rpcEndpoint]);

    const program = useMemo(() => {
        if (!connection || !smartWalletPubkey) return null;
        try {
            const anchorWalletPubkey = new PublicKey(smartWalletPubkey.toString());
            const wallet = {
                publicKey: anchorWalletPubkey,
                signTransaction: async (tx: any) => tx,
                signAllTransactions: async (txs: any[]) => txs,
            };
            const provider = new anchor.AnchorProvider(connection, wallet as any, { preflightCommitment: 'confirmed' });
            return new Program(IDL, provider);
        } catch (e) {
            console.error("useUserProfile: Failed to init program", e);
            return null;
        }
    }, [connection, smartWalletPubkey?.toString()]);

    const decodeString = (bytes: number[]) => {
        return new TextDecoder().decode(new Uint8Array(bytes)).replace(/\0/g, '');
    };

    const encodeString = (str: string, length: number) => {
        const arr = new Uint8Array(length);
        const bytes = new TextEncoder().encode(str);
        arr.set(bytes.slice(0, length));
        return Array.from(arr);
    };

    const checkAndAirdrop = async (address: anchor.web3.PublicKey) => {
        try {
            const balance = await connection.getBalance(address);
            // Need roughly 0.00139 SOL for profile account rent (1,392,000 lamports)
            const requiredBalance = 0.002 * anchor.web3.LAMPORTS_PER_SOL; // 0.002 SOL buffer

            if (balance < requiredBalance) {
                console.log("Requesting account rent funding from treasury for:", address.toString());

                // Use fund-rent endpoint which bypasses FairScale trust score check
                // This is appropriate because profile creation rent is a one-time system cost,
                // not a token airdrop that could be exploited by Sybil attackers
                const response = await fetch('/api/fund-rent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountAddress: address.toString(),
                        rentAmount: requiredBalance // Request exact amount needed
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Account rent funding failed");
                }

                const data = await response.json();
                console.log("Account rent funding successful, tx:", data.signature);

                // Short pause to let the network process the transfer
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (err) {
            console.warn("Account rent funding error:", err);
            if (err instanceof Error && err.message.includes("Treasury key missing")) {
                console.error("⚠️ Developer Tip: Add 'TREASURY_SECRET_KEY' to your .env.local to enable automated account rent funding for new users.");
            }
            // Re-throw to prevent profile creation from continuing without funds
            throw err;
        }
    };

    const fetchProfile = async () => {
        if (!smartWalletPubkey || !program) return;
        setLoading(true);
        try {
            const [profilePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("user-profile-v1"), new PublicKey(smartWalletPubkey.toString()).toBuffer()],
                new PublicKey(PROGRAM_ID_STR)
            );

            // @ts-ignore
            const account = await program.account.userProfile.fetchNullable(profilePda);
            if (account) {
                const decodedProfile = {
                    username: decodeString(account.username as number[]),
                    emoji: decodeString(account.emoji as number[]),
                    gender: decodeString(account.gender as number[]),
                    pin: decodeString(account.pin as number[]),
                    authority: account.authority as anchor.web3.PublicKey
                };
                setProfile(decodedProfile);
                localStorage.setItem(`cadpay_profile_exists_${smartWalletPubkey.toString()}`, 'true');
            } else {
                setProfile(null);
                localStorage.removeItem(`cadpay_profile_exists_${smartWalletPubkey.toString()}`);
            }
        } catch (err: any) {
            if (err.message.includes("discriminator") || err.message.includes("Account does not exist")) {
                setProfile(null);
            } else {
                console.error("Failed to fetch profile:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    // OPTIMIZATION: Pre-check and fund account as soon as wallet connects
    // This removes the 2s delay from the "Create" button click, reducing "TransactionTooOld" errors
    useEffect(() => {
        if (smartWalletPubkey) {
            const userPubkey = new PublicKey(smartWalletPubkey.toString());
            checkAndAirdrop(userPubkey).catch(e => console.warn("Background funding check failed:", e));
        }
    }, [smartWalletPubkey?.toString()]);

    const createProfile = async (username: string, emoji: string, gender: string, pin: string) => {
        if (!smartWalletPubkey || !program) throw new Error("Wallet not connected");
        setLoading(true);
        setError(null);
        try {
            const userPubkey = new PublicKey(smartWalletPubkey.toString());

            const [profilePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("user-profile-v1"), userPubkey.toBuffer()],
                new PublicKey(PROGRAM_ID_STR)
            );

            // Prefer Anchor's fetchNullable to reliably detect existing PDA
            try {
                // @ts-ignore
                const existing = await program.account.userProfile.fetchNullable(profilePda);
                if (existing) {
                    return await updateProfile(username, emoji, gender, pin);
                }
            } catch (e) {
                console.warn('Could not fetch profile account; proceeding to initialize', e);
            }

            const usernameBytes = encodeString(username, 16);
            const emojiBytes = encodeString(emoji, 4);
            const genderBytes = encodeString(gender, 8);
            const pinBytes = encodeString(pin, 4);

            const instruction = await program.methods
                .initializeUser(usernameBytes, emojiBytes, genderBytes, pinBytes)
                .accounts({
                    userProfile: profilePda,
                    user: userPubkey,
                    systemProgram: SystemProgram.programId,
                } as any)
                .instruction();

            // Correctly formatted call for Lazorkit SDK
            // We pass 'addressLookupTableAccounts: []' to force the SDK to use VersionedTransaction (v0)
            // This is critical to avoid "Transaction too large" errors (1232 byte limit)
            const signature = await signAndSendTransaction({
                instructions: [instruction],
                transactionOptions: {
                    addressLookupTableAccounts: []
                }
            });
            console.log("Transaction sent, awaiting confirmation...", signature);

            // OPTIMISTIC UPDATE
            setProfile({
                username,
                emoji,
                gender,
                pin,
                authority: userPubkey
            });
            localStorage.setItem(`cadpay_profile_exists_${smartWalletPubkey.toString()}`, 'true');

            // Try to confirm the signature quickly
            try {
                const latestBlockhash = await connection.getLatestBlockhash();
                await connection.confirmTransaction({
                    signature,
                    ...latestBlockhash
                }, 'confirmed');
            } catch (e) {
                // ignore
            }

            // Poll for account presence
            const maxAttempts = 20;
            let found = false;
            for (let i = 0; i < maxAttempts; i++) {
                try {
                    // @ts-ignore
                    const existing = await program.account.userProfile.fetchNullable(profilePda, 'confirmed');
                    if (existing) {
                        found = true;
                        break;
                    }
                } catch (e) {
                    // ignore
                }
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            if (!found) {
                console.warn('Profile not visible on-chain after waiting; but trusting optimistic update');
            }

            await fetchProfile();
            return signature;
        } catch (err: any) {
            console.error("Error creating profile:", err);
            setError(err.message || "Failed to create profile");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (username: string, emoji: string, gender: string, pin: string) => {
        if (!smartWalletPubkey || !program) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const userPubkey = new PublicKey(smartWalletPubkey.toString());
            const [profilePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("user-profile-v1"), userPubkey.toBuffer()],
                new PublicKey(PROGRAM_ID_STR)
            );

            const usernameBytes = encodeString(username, 16);
            const emojiBytes = encodeString(emoji, 4);
            const genderBytes = encodeString(gender, 8);
            const pinBytes = encodeString(pin, 4);

            const instruction = await program.methods
                .updateUser(usernameBytes, emojiBytes, genderBytes, pinBytes)
                .accounts({
                    userProfile: profilePda,
                    user: userPubkey,
                    authority: userPubkey
                } as any)
                .instruction();

            // Correctly formatted call for Lazorkit SDK
            // We pass 'addressLookupTableAccounts: []' to force the SDK to use VersionedTransaction (v0)
            const signature = await signAndSendTransaction({
                instructions: [instruction],
                transactionOptions: {
                    addressLookupTableAccounts: []
                }
            });
            await fetchProfile();
        } catch (err: any) {
            console.error("Error updating profile:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (smartWalletPubkey && program) {
            fetchProfile();
        } else if (!smartWalletPubkey) {
            setProfile(null);
        }
    }, [smartWalletPubkey?.toString(), !!program]);

    return {
        profile,
        loading,
        error,
        createProfile,
        updateProfile,
        fetchProfile
    };
}
