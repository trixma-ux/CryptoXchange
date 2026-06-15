import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  TrendingUp, Shield, Zap, Globe, ArrowRight, ChevronRight,
  Smartphone, Repeat2, Banknote, Lock, CheckCircle2, Star
} from 'lucide-react';

const CRYPTO_TICKERS = [
  { symbol: 'BTC', price: '95,000', change: '+2.34%', positive: true, color: '#f7931a' },
  { symbol: 'ETH', price: '2,057,000', change: '+1.87%', positive: true, color: '#627eea' },
  { symbol: 'USDT', price: '605', change: '+0.01%', positive: true, color: '#26a17b' },
  { symbol: 'BNB', price: '375,100', change: '-0.45%', positive: false, color: '#f3ba2f' },
  { symbol: 'SOL', price: '111,925', change: '+3.12%', positive: true, color: '#9945ff' },
  { symbol: 'LTC', price: '63,525', change: '-1.23%', positive: false, color: '#b9b9b9' },
];

const FEATURES = [
  { icon: Shield, title: 'Sécurité 2FA', desc: 'Authentification à deux facteurs, chiffrement bout en bout.', color: '#6366f1' },
  { icon: Zap, title: 'Échanges Instantanés', desc: 'Transactions confirmées en quelques secondes.', color: '#f59e0b' },
  { icon: Globe, title: 'Mobile Money', desc: 'Orange, MTN, Wave, Moov, Airtel — dépôts en FCFA.', color: '#10b981' },
  { icon: TrendingUp, title: 'Temps Réel', desc: 'Prix live, graphiques, portfolio en FCFA.', color: '#3b82f6' },
];

const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#f7931a', bg: '#fff7ed' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627eea', bg: '#eef2ff' },
  { symbol: 'USDT', name: 'Tether', color: '#26a17b', bg: '#f0fdf4' },
  { symbol: 'BNB', name: 'BNB', color: '#f3ba2f', bg: '#fffbeb' },
  { symbol: 'SOL', name: 'Solana', color: '#9945ff', bg: '#faf5ff' },
  { symbol: 'LTC', name: 'Litecoin', color: '#999', bg: '#f8fafc' },
];

const STEPS = [
  { num: '01', title: 'Créer un compte', desc: 'Inscription rapide en 2 minutes avec vérification email.' },
  { num: '02', title: 'Vérifier votre identité', desc: 'KYC simple : photo de pièce d\'identité depuis votre téléphone.' },
  { num: '03', title: 'Déposer des fonds', desc: 'Via Orange Money, MTN, Wave ou virement bancaire en FCFA.' },
  { num: '04', title: 'Trader librement', desc: 'Achetez, vendez, échangez vos cryptos en toute sécurité.' },
];

export default function LandingPage() {
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
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>₿</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 20, color: '#0f172a', letterSpacing: '-0.5px' }}>CryptoXchange</span>
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

      {/* ── TICKER ── */}
      <div style={{
        position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
        backgroundColor: '#0f172a', height: 36, overflow: 'hidden', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', animation: 'ticker 30s linear infinite', whiteSpace: 'nowrap' }}>
          {[...CRYPTO_TICKERS, ...CRYPTO_TICKERS].map((c, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 24px', fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: c.color }}>●</span>
              <span style={{ fontWeight: 700, color: 'white' }}>{c.symbol}</span>
              <span style={{ color: '#94a3b8' }}>{c.price} FCFA</span>
              <span style={{ color: c.positive ? '#10b981' : '#ef4444', fontWeight: 600 }}>{c.change}</span>
            </span>
          ))}
        </div>
        <style>{`@keyframes ticker { 0%{ transform: translateX(0) } 100%{ transform: translateX(-50%) } }`}</style>
      </div>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 160, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100,
              background: '#eef2ff', color: '#6366f1', fontSize: 13, fontWeight: 600, marginBottom: 24,
            }}>
              <Star fill="#6366f1" className="w-3 h-3" style={{ width: 12, height: 12 }} />
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

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {['✓ Sans frais cachés', '✓ KYC rapide', '✓ Support 24/7'].map(t => (
                <span key={t} style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </motion.div>

          {/* Dashboard card preview */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              borderRadius: 24, padding: 32, color: 'white', position: 'relative', overflow: 'hidden',
              boxShadow: '0 32px 64px rgba(99,102,241,0.35)',
            }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Portefeuille total</p>
                <p style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-1px', marginBottom: 4 }}>1,248,500</p>
                <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 28 }}>FCFA</p>

                <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                  {[
                    { label: 'Acheter', icon: '+' },
                    { label: 'Vendre', icon: '↗' },
                    { label: 'Swap', icon: '⇄' },
                    { label: 'Dépôt', icon: '↓' },
                  ].map(a => (
                    <div key={a.label} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px',
                        fontSize: 18, fontWeight: 700, backdropFilter: 'blur(8px)',
                      }}>{a.icon}</div>
                      <p style={{ fontSize: 11, opacity: 0.8 }}>{a.label}</p>
                    </div>
                  ))}
                </div>

                {CRYPTO_TICKERS.slice(0, 3).map(c => (
                  <div key={c.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', marginBottom: 8, borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{c.symbol[0]}</div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{c.symbol}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.positive ? '#86efac' : '#fca5a5' }}>{c.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '64px 24px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { value: '50K+', label: 'Utilisateurs actifs' },
            { value: '2.5B', label: 'FCFA volume mensuel' },
            { value: '12+', label: 'Cryptos supportées' },
            { value: '5', label: 'Opérateurs Mobile Money' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1px', color: '#0f172a', marginBottom: 8 }}>{s.value}</p>
              <p style={{ fontSize: 14, color: '#64748b' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CRYPTOS ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f8f9ff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>Cryptos Supportées</h2>
            <p style={{ fontSize: 17, color: '#64748b' }}>Achetez et échangez les meilleures cryptomonnaies</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            {CRYPTOS.map((c, i) => (
              <motion.div key={c.symbol} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                style={{ background: 'white', borderRadius: 20, padding: '24px 16px', textAlign: 'center', border: '1.5px solid #f1f5f9', cursor: 'pointer', transition: 'all .2s' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: c.bg, border: `2px solid ${c.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22, fontWeight: 900, color: c.color }}>
                  {c.symbol[0]}
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.symbol}</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{c.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>Pourquoi CryptoXchange ?</h2>
            <p style={{ fontSize: 17, color: '#64748b' }}>Conçu pour l'Afrique, sécurisé pour le monde</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                style={{ background: 'white', borderRadius: 20, padding: 32, border: '1.5px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <f.icon style={{ width: 24, height: 24, color: f.color }} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f8f9ff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>Commencer en 4 étapes</h2>
            <p style={{ fontSize: 17, color: '#64748b' }}>Simple, rapide et sécurisé</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {STEPS.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
                style={{ background: 'white', borderRadius: 20, padding: 32, border: '1.5px solid #e2e8f0', position: 'relative' }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#e2e8f0', letterSpacing: '-1px', display: 'block', marginBottom: 16 }}>{s.num}</span>
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOBILE MONEY ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            borderRadius: 28, padding: '64px 48px', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center',
          }}>
            <div>
              <p style={{ color: '#a5b4fc', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Mobile Money</p>
              <h2 style={{ fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 20 }}>
                Payez avec votre<br />
                <span style={{ background: 'linear-gradient(90deg, #a5b4fc, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  téléphone
                </span>
              </h2>
              <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.65, marginBottom: 36 }}>
                Déposez et retirez directement via votre opérateur Mobile Money. Pas besoin de carte bancaire.
              </p>
              <Link href="/auth/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15,
                background: 'white', color: '#0f172a', boxShadow: '0 4px 14px rgba(255,255,255,0.15)',
              }}>
                Créer un compte gratuit <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { name: 'Orange Money', color: '#ff6600', bg: 'rgba(255,102,0,0.15)' },
                  { name: 'MTN MoMo', color: '#ffc107', bg: 'rgba(255,193,7,0.15)' },
                  { name: 'Wave', color: '#0075ff', bg: 'rgba(0,117,255,0.15)' },
                  { name: 'Moov Money', color: '#00b4d8', bg: 'rgba(0,180,216,0.15)' },
                  { name: 'Airtel Money', color: '#e50914', bg: 'rgba(229,9,20,0.15)' },
                  { name: 'Virement', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
                ].map(p => (
                  <div key={p.name} style={{
                    background: p.bg, borderRadius: 14, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', backgroundColor: '#f8f9ff' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 20 }}>
              Prêt à investir<br />
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                dans les cryptos ?
              </span>
            </h2>
            <p style={{ fontSize: 18, color: '#64748b', marginBottom: 40, lineHeight: 1.65 }}>
              Rejoignez +50 000 utilisateurs qui font confiance à CryptoXchange pour leurs investissements.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                padding: '16px 36px', borderRadius: 14, fontWeight: 700, fontSize: 17,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                boxShadow: '0 8px 28px rgba(99,102,241,0.4)',
              }}>
                Créer mon compte — Gratuit <ChevronRight style={{ width: 20, height: 20 }} />
              </Link>
            </div>
            <p style={{ marginTop: 20, fontSize: 13, color: '#94a3b8' }}>Aucune carte bancaire requise · Inscription en 2 min</p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '48px 24px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 15 }}>₿</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 18, color: '#0f172a' }}>CryptoXchange</span>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>© 2025 CryptoXchange. Tous droits réservés.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['CGU', 'Confidentialité', 'Support'].map(item => (
              <a key={item} href="#" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>{item}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
