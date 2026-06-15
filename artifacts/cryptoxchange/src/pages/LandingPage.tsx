import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, Shield, Zap, Globe, ArrowRight, Star
} from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';
import { pricesAPI } from '@/lib/api';

const CRYPTO_META: Record<string, { color: string; name: string; bg: string }> = {
  BTC: { color: '#f7931a', name: 'Bitcoin', bg: '#fff7ed' },
  ETH: { color: '#627eea', name: 'Ethereum', bg: '#eef2ff' },
  USDT_TRC20: { color: '#26a17b', name: 'Tether', bg: '#f0fdf4' },
  BNB: { color: '#f3ba2f', name: 'BNB', bg: '#fffbeb' },
  SOL: { color: '#9945ff', name: 'Solana', bg: '#faf5ff' },
  LTC: { color: '#b9b9b9', name: 'Litecoin', bg: '#f8fafc' },
  XRP: { color: '#00aae4', name: 'XRP', bg: '#f0f9ff' },
  DOGE: { color: '#c2a633', name: 'Dogecoin', bg: '#fefce8' },
};

const FEATURES = [
  { icon: Shield, title: 'Sécurité 2FA', desc: 'Authentification à deux facteurs, chiffrement bout en bout.', color: '#6366f1' },
  { icon: Zap, title: 'Échanges Instantanés', desc: 'Transactions confirmées en quelques secondes.', color: '#f59e0b' },
  { icon: Globe, title: 'Mobile Money', desc: 'Orange, MTN, Wave, Moov, Airtel — dépôts en FCFA.', color: '#10b981' },
  { icon: TrendingUp, title: 'Temps Réel', desc: 'Prix live CoinGecko, graphiques, portfolio en FCFA.', color: '#3b82f6' },
];

const STEPS = [
  { num: '01', title: 'Créer un compte', desc: 'Inscription rapide en 2 minutes avec vérification email.' },
  { num: '02', title: 'Vérifier votre identité', desc: 'KYC simple : photo de pièce d\'identité depuis votre téléphone.' },
  { num: '03', title: 'Déposer des fonds', desc: 'Via Orange Money, MTN, Wave ou virement bancaire en FCFA.' },
  { num: '04', title: 'Trader librement', desc: 'Achetez, vendez, échangez vos cryptos en toute sécurité.' },
];

function formatFCFA(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  return n.toFixed(2);
}

export default function LandingPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = async () => {
    try {
      const res = await pricesAPI.getPrices();
      const data: any[] = res.data?.data || [];
      setPrices(data.filter(p => CRYPTO_META[p.currency]));
      setLiveIndicator(prev => !prev);
    } catch {}
  };

  useEffect(() => {
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const tickerItems = prices.length > 0 ? prices : Object.keys(CRYPTO_META).map(c => ({
    currency: c, priceFCFA: 0, change24h: 0,
  }));

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: '#ffffff', color: '#0f172a' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0', height: 64,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <PremiumLogo size={34} textSize={20} />
          </Link>

          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {['Marchés', 'Acheter', 'Échanger', 'À propos'].map(item => (
              <a key={item} href="#" style={{ fontSize: 14, fontWeight: 500, color: '#64748b', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#0f172a')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = '#64748b')}>
                {item}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/auth/login" style={{
              fontSize: 14, fontWeight: 600, color: '#0f172a', textDecoration: 'none',
              padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', transition: 'all .2s'
            }}>Se connecter</Link>
            <Link href="/auth/register" style={{
              fontSize: 14, fontWeight: 600, color: 'white', textDecoration: 'none',
              padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35)'
            }}>Créer un compte</Link>
          </div>
        </div>
      </nav>

      {/* ── LIVE TICKER ── */}
      <div style={{
        position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
        backgroundColor: '#0f172a', height: 36, overflow: 'hidden', display: 'flex', alignItems: 'center',
      }}>
        {/* Live badge */}
        <div style={{
          position: 'absolute', left: 12, zIndex: 2,
          display: 'flex', alignItems: 'center', gap: 5,
          backgroundColor: '#0f172a', paddingRight: 8,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 6px #10b981',
            display: 'inline-block',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: 1 }}>LIVE</span>
        </div>

        <div style={{ display: 'flex', animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap', paddingLeft: 80 }}>
          {[...tickerItems, ...tickerItems].map((c, i) => {
            const meta = CRYPTO_META[c.currency];
            const positive = c.change24h >= 0;
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 20px', fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: meta?.color || '#94a3b8' }}>●</span>
                <span style={{ fontWeight: 700, color: 'white' }}>{c.currency.replace('_TRC20', '').replace('_ERC20', '')}</span>
                <span style={{ color: '#94a3b8' }}>
                  {c.priceFCFA > 0 ? formatFCFA(c.priceFCFA) + ' FCFA' : '—'}
                </span>
                {c.change24h !== 0 && (
                  <span style={{ color: positive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {positive ? '+' : ''}{c.change24h.toFixed(2)}%
                  </span>
                )}
              </span>
            );
          })}
        </div>

        <style>{`
          @keyframes ticker { 0%{ transform: translateX(0) } 100%{ transform: translateX(-50%) } }
          @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:0.4 } }
        `}</style>
      </div>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 160, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100,
              background: '#eef2ff', color: '#6366f1', fontSize: 13, fontWeight: 600, marginBottom: 24,
            }}>
              <Star fill="#6366f1" style={{ width: 12, height: 12 }} />
              Plateforme #1 en Afrique de l'Ouest
            </div>

            <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 24, color: '#0f172a' }}>
              Achetez.<br />
              Vendez.<br />
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Échangez.
              </span>
            </h1>

            <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.65, marginBottom: 40, maxWidth: 480 }}>
              La plateforme crypto sécurisée pour l'Afrique. Payez avec Orange Money, MTN, Wave en FCFA. Simple, rapide, fiable.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link href="/auth/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 16,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)', transition: 'transform .2s',
              }}>
                Commencer gratuitement <ArrowRight style={{ width: 18, height: 18 }} />
              </Link>
              <Link href="/auth/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                padding: '14px 28px', borderRadius: 12, fontWeight: 600, fontSize: 16,
                border: '1.5px solid #e2e8f0', color: '#0f172a', background: 'white',
              }}>
                Se connecter
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 32 }}>
              {[{ n: '50K+', l: 'Utilisateurs actifs' }, { n: '99.9%', l: 'Uptime garanti' }, { n: '< 2min', l: 'Délai de traitement' }].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Live Price Cards */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <div style={{
              background: '#0f172a', borderRadius: 24, padding: 24,
              boxShadow: '0 24px 80px rgba(99,102,241,0.2)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Marchés en direct</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981',
                    boxShadow: '0 0 6px #10b981', display: 'inline-block',
                    animation: 'pulse 2s infinite',
                  }} />
                  <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                    {prices.length > 0 && prices[0].source === 'live' ? 'Temps réel' : 'Actualisation...'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(prices.length > 0 ? prices.slice(0, 6) : Object.keys(CRYPTO_META).slice(0, 6).map(c => ({ currency: c, priceFCFA: 0, change24h: 0 }))).map((p: any) => {
                  const meta = CRYPTO_META[p.currency];
                  if (!meta) return null;
                  const positive = p.change24h >= 0;
                  const symbol = p.currency.replace('_TRC20', '').replace('_ERC20', '');
                  return (
                    <div key={p.currency} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: meta.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: meta.color }}>{symbol[0]}</span>
                        </div>
                        <div>
                          <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{symbol}</div>
                          <div style={{ color: '#64748b', fontSize: 11 }}>{meta.name}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                          {p.priceFCFA > 0 ? formatFCFA(p.priceFCFA) + ' FCFA' : '—'}
                        </div>
                        {p.change24h !== 0 && (
                          <div style={{ fontSize: 11, fontWeight: 600, color: positive ? '#10b981' : '#ef4444' }}>
                            {positive ? '▲' : '▼'} {Math.abs(p.change24h).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#334155' }}>
                Mis à jour toutes les 30 secondes · CoinGecko
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>Pourquoi CryptoXchange ?</h2>
            <p style={{ color: '#64748b', fontSize: 17, maxWidth: 520, margin: '0 auto' }}>
              Conçu pour l'Afrique de l'Ouest, alimenté par la technologie blockchain mondiale.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <motion.div key={title} whileHover={{ y: -4 }} style={{
                padding: 28, borderRadius: 20, backgroundColor: 'white',
                boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon style={{ width: 22, height: 22, color }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 8 }}>{title}</div>
                <div style={{ color: '#64748b', lineHeight: 1.6, fontSize: 14 }}>{desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRYPTO GRID ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Cryptomonnaies disponibles</h2>
            <p style={{ color: '#64748b' }}>Prix mis à jour en temps réel via CoinGecko</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {Object.entries(CRYPTO_META).map(([sym, meta]) => {
              const p = prices.find(x => x.currency === sym);
              const positive = (p?.change24h ?? 0) >= 0;
              const displaySym = sym.replace('_TRC20', '').replace('_ERC20', '');
              return (
                <motion.div key={sym} whileHover={{ scale: 1.03 }} style={{
                  padding: '20px 18px', borderRadius: 16,
                  background: `linear-gradient(135deg, ${meta.bg}, white)`,
                  border: `1.5px solid ${meta.color}22`,
                  cursor: 'pointer', transition: 'box-shadow .2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: meta.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontWeight: 900, fontSize: 15, color: meta.color }}>{displaySym[0]}</span>
                    </div>
                    {p && p.change24h !== 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100, backgroundColor: positive ? '#dcfce7' : '#fee2e2', color: positive ? '#16a34a' : '#dc2626' }}>
                        {positive ? '+' : ''}{p.change24h.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{displaySym}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{meta.name}</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                    {p && p.priceFCFA > 0 ? formatFCFA(p.priceFCFA) + ' FCFA' : '—'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Commencer en 4 étapes</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} style={{ textAlign: 'center', padding: 28 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900, color: 'white',
                }}>{num}</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 8 }}>{title}</div>
                <div style={{ color: '#64748b', lineHeight: 1.6, fontSize: 14 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 42, fontWeight: 900, color: 'white', marginBottom: 16 }}>
          Prêt à investir dans votre avenir ?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          Rejoignez des milliers d'Africains qui font confiance à CryptoXchange.
        </p>
        <Link href="/auth/register" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          padding: '16px 36px', borderRadius: 14, fontWeight: 700, fontSize: 17,
          backgroundColor: 'white', color: '#6366f1',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}>
          Ouvrir un compte gratuitement <ArrowRight style={{ width: 20, height: 20 }} />
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#0f172a', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <PremiumLogo size={28} textSize={16} darkMode />
        </div>
        <p style={{ color: '#334155', fontSize: 13 }}>
          © {new Date().getFullYear()} CryptoXchange — Plateforme crypto pour l'Afrique de l'Ouest
        </p>
        <p style={{ color: '#1e293b', fontSize: 11, marginTop: 8 }}>
          Données de prix fournies par CoinGecko · Mises à jour toutes les 30 secondes
        </p>
      </footer>
    </div>
  );
}
