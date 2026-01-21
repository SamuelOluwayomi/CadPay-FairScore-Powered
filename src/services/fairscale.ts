export interface FairScoreResponse {
    walletAddress: string;
    score: number;
    tier: 'HIGH' | 'MEDIUM' | 'LOW';
    lastUpdated: string;
}

export const MINIMUM_FAUCET_SCORE = 40;
export const SCORE_TIER_HIGH = 70;
export const SCORE_TIER_MEDIUM = 40;

function hashWalletAddress(address: string): number {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
        const char = address.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function generateMockScore(walletAddress: string): number {
    const hash = hashWalletAddress(walletAddress);
    return (hash % 100) + 1;
}

export async function getMockFairScore(walletAddress: string): Promise<FairScoreResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const score = generateMockScore(walletAddress);
    const tier = score >= SCORE_TIER_HIGH ? 'HIGH' : score >= SCORE_TIER_MEDIUM ? 'MEDIUM' : 'LOW';

    return {
        walletAddress,
        score,
        tier,
        lastUpdated: new Date().toISOString()
    };
}

export async function checkMinimumScore(walletAddress: string, minScore: number = MINIMUM_FAUCET_SCORE): Promise<boolean> {
    const response = await getMockFairScore(walletAddress);
    return response.score >= minScore;
}

export function getScoreTier(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= SCORE_TIER_HIGH) return 'HIGH';
    if (score >= SCORE_TIER_MEDIUM) return 'MEDIUM';
    return 'LOW';
}

export function getScoreColor(score: number): string {
    const tier = getScoreTier(score);
    switch (tier) {
        case 'HIGH': return '#10B981';
        case 'MEDIUM': return '#F59E0B';
        case 'LOW': return '#EF4444';
    }
}
