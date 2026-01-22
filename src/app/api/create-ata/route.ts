import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to create Associated Token Accounts from treasury
 * This bypasses smart wallet transaction size limits by having the treasury create ATAs directly
 */
export async function POST(req: NextRequest) {
    try {
        const { ownerAddress, mintAddress } = await req.json();

        if (!ownerAddress || !mintAddress) {
            return NextResponse.json({ error: 'Missing ownerAddress or mintAddress' }, { status: 400 });
        }

        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
        const connection = new Connection(rpcUrl, "confirmed");

        const rawKey = process.env.TREASURY_SECRET_KEY;
        if (!rawKey) {
            console.log("Treasury key missing in environment");
            throw new Error("Treasury key missing in environment");
        }

        let secretKey: Uint8Array;
        try {
            if (rawKey.trim().startsWith('[')) {
                secretKey = new Uint8Array(JSON.parse(rawKey));
            } else {
                secretKey = bs58.decode(rawKey);
            }
        } catch (e) {
            console.error("Key format error:", e);
            throw new Error("Invalid TREASURY_SECRET_KEY format - must be [1,2,3...] or Base58 string");
        }

        const treasury = Keypair.fromSecretKey(secretKey);
        const ownerPubkey = new PublicKey(ownerAddress);
        const mintPubkey = new PublicKey(mintAddress);

        // Derive the ATA address
        const ataAddress = await getAssociatedTokenAddress(
            mintPubkey,
            ownerPubkey,
            true, // allowOwnerOffCurve for PDAs
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Check if ATA already exists
        const ataInfo = await connection.getAccountInfo(ataAddress);
        if (ataInfo) {
            return NextResponse.json({
                success: true,
                ataAddress: ataAddress.toBase58(),
                alreadyExists: true,
                message: 'ATA already exists'
            });
        }

        // Create the ATA
        const createAtaInstruction = createAssociatedTokenAccountInstruction(
            treasury.publicKey, // payer (treasury)
            ataAddress,         // ata
            ownerPubkey,        // owner
            mintPubkey,         // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const transaction = new Transaction().add(createAtaInstruction);
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = treasury.publicKey;

        const signature = await connection.sendTransaction(transaction, [treasury]);

        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');

        console.log(`Created ATA ${ataAddress.toBase58()} for owner ${ownerAddress}. Signature: ${signature}`);

        return NextResponse.json({
            success: true,
            signature,
            ataAddress: ataAddress.toBase58(),
            alreadyExists: false
        });
    } catch (error: any) {
        console.error("Create ATA error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
