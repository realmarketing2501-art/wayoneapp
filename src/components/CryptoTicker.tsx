import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Coin = {
  id: string;
  symbol: string;
  price: number;
  change: number;
};

const COINS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'tether', symbol: 'USDT' },
  { id: 'binancecoin', symbol: 'BNB' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'ripple', symbol: 'XRP' },
  { id: 'cardano', symbol: 'ADA' },
  { id: 'dogecoin', symbol: 'DOGE' },
  { id: 'tron', symbol: 'TRX' },
  { id: 'polkadot', symbol: 'DOT' },
  { id: 'avalanche-2', symbol: 'AVAX' },
  { id: 'chainlink', symbol: 'LINK' },
];

const FALLBACK: Coin[] = COINS.map((c, i) => ({
  ...c,
  price: [67000, 3500, 1, 580, 145, 0.55, 0.42, 0.16, 0.12, 7.2, 36, 18][i] || 1,
  change: 0,
}));

const CACHE_KEY = 'crypto_ticker_cache_v1';
const CACHE_TTL = 1000 * 60 * 2; // 2 min

export default function CryptoTicker() {
  const [coins, setCoins] = useState<Coin[]>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.coins?.length) return parsed.coins as Coin[];
      }
    } catch {}
    return FALLBACK;
  });

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) return;
      } catch {}
    }

    const fetchPrices = async () => {
      try {
        const ids = COINS.map((c) => c.id).join(',');
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
          { headers: { accept: 'application/json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const updated: Coin[] = COINS.map((c) => ({
          ...c,
          price: Number(data[c.id]?.usd ?? 0),
          change: Number(data[c.id]?.usd_24h_change ?? 0),
        })).filter((c) => c.price > 0);
        if (updated.length) {
          setCoins(updated);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts: Date.now(), coins: updated })
          );
        }
      } catch (err) {
        console.error("Failed to fetch crypto prices", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  const items = [...coins, ...coins];

  const fmt = (n: number) => {
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };

  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card to-transparent" />
      <div className="flex animate-marquee whitespace-nowrap py-1.5">
        {items.map((c, i) => {
          const up = c.change >= 0;
          return (
            <div
              key={`${c.id}-${i}`}
              className="mx-3 inline-flex items-center gap-1.5 text-[0.7rem]"
            >
              <span className="font-display font-semibold text-foreground">{c.symbol}</span>
              <span className="font-mono text-foreground/90">${fmt(c.price)}</span>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-mono',
                  up ? 'text-emerald-500' : 'text-rose-500'
                )}
              >
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {up ? '+' : ''}
                {c.change.toFixed(2)}%
              </span>
              <span className="text-border">|</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
