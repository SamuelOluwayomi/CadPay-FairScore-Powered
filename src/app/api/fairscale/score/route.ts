import { NextRequest, NextResponse } from 'next/server';

const FAIRSCALE_API_KEY = 'tuS0MtA6fdaa7efu0yOyKQq90iYwVbyr';
const FAIRSCALE_BASE_URL = 'https://api.fairscale.xyz';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        const response = await fetch(
            `${FAIRSCALE_BASE_URL}/score?wallet=${encodeURIComponent(wallet)}`,
            {
                method: 'GET',
                headers: {
                    'fairkey': FAIRSCALE_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error('FairScale API error:', response.status, response.statusText);
            const errorText = await response.text();
            return NextResponse.json(
                { error: `FairScale API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('FairScale proxy error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch score' },
            { status: 500 }
        );
    }
}
