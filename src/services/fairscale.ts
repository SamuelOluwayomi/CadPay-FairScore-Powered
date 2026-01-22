export interface FairScoreResponse {
    walletAddress: string;
    score: number;
    tier: 'HIGH' | 'MEDIUM' | 'LOW';
    lastUpdated: string;
    rawData?: any;
}

export const MINIMUM_FAUCET_SCORE = 40;
export const SCORE_TIER_HIGH = 70;
export const SCORE_TIER_MEDIUM = 40;

export async function getFairScore(walletAddress: string): Promise<FairScoreResponse> {
    try {
        const response = await fetch(
            `/api/fairscale/score?wallet=${encodeURIComponent(walletAddress)}`
        );

        if (!response.ok) {
            console.error('FairScale API error:', response.status, response.statusText);
            throw new Error(`FairScale API error: ${response.status}`);
        }

        const data = await response.json();
        const score = Math.round(data.fairscore || 0);
        const tier = score >= SCORE_TIER_HIGH ? 'HIGH' : score >= SCORE_TIER_MEDIUM ? 'MEDIUM' : 'LOW';

        return {
            walletAddress,
            score,
            tier,
            lastUpdated: data.timestamp || new Date().toISOString(),
            rawData: data
        };
    } catch (error) {
        console.error('Failed to fetch FairScore:', error);
        throw error;
    }
}

export async function checkMinimumScore(walletAddress: string, minScore: number = MINIMUM_FAUCET_SCORE): Promise<boolean> {
    try {
        const response = await getFairScore(walletAddress);
        return response.score >= minScore;
    } catch (error) {
        console.error('Error checking minimum score:', error);
        return false;
    }
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
