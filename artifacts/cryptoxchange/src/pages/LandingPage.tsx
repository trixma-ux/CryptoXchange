import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap, Globe, ArrowRight, Bitcoin, ChevronRight } from 'lucide-react';

const CRYPTO_TICKERS = [
  { symbol: 'BTC', name: 'Bitcoin', price: '95,000 FCFA', change: '+2.34%', positive: true },
  { symbol: 'ETH', name: 'Ethereum', price: '2,057,000 FCFA', change: '+1.87%', positive: true },
  { symbol: 'USDT', name: 'Tether', price: '605 FCFA', change: '+0.01%', positive: true },
  { symbol: 'BNB', name: 'BNB', price: '375,100 FCFA', change: '-0.45%', positive: false },
  { symbol: 'SOL', name: 'Solana', price: '111,925 FCFA', change: '+3.12%', positive: true },
  { symbol: 'LTC', name: 'Litecoin', price: '63,525 FCFA', change: '-1.23%', positive: false },
];

const FEATURES = [
  { icon: Shield, title: 'Sécurité Maximale', desc: 'Authentification 2FA, chiffrement de bout en bout, protection anti-fraude.' },
  { icon: Zap, title: 'Transactions Rapides', desc: 'Confirmations en quelques secondes. Trading et échanges instantanés.' },
  { icon: Globe, title: 'Mobile Money Intégré', desc: 'Orange Money, MTN, Wave, Moov. Dépôts et retraits en FCFA.' },
  { icon: TrendingUp, title: 'Suivi en Temps Réel', desc: 'Graphiques live, prix en temps réel, portfolio en FCFA.' },
];

const SUPPORTED_CRYPTOS = [
  { symbol: 'BTC', color: '#f7931a' },
  { symbol: 'ETH', color: '#627eea' },
  { symbol: 'USDT', color: '#26a17b' },
  { symbol: 'BNB', color: '#f3ba2f' },
  { symbol: 'SOL', color: '#9945ff' },
  { symbol: 'LTC', color: '#bfbbbb' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dots overflow-hidden" style={{ backgroundColor: '#080d1a' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(8,13,26,0.8)', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Bitcoin className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-black gradient-text">CryptoXchange</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['Marchés', 'Acheter', 'Échanger', 'À propos'].map((item) => (
              <a key={item} href="#" className="text-sm font-medium transition-colors" style={{ color: '#94a3b8', textDecoration: 'none' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = 'white'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = '#94a3b8'}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm">Se connecter</Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Créer un compte</Link>
          </div>
        </div>
      </nav>

      {/* Ticker Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 backdrop-blur-sm border-b py-2" style={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="ticker-wrap">
          <div className="ticker">
            {[...CRYPTO_TICKERS, ...CRYPTO_TICKERS].map((crypto, i) => (
              <div key={i} className="flex items-center gap-2 px-6 text-sm whitespace-nowrap">
                <span className="font-bold text-white">{crypto.symbol}</span>
                <span style={{ color: '#94a3b8' }}>{crypto.price}</span>
                <span style={{ color: crypto.positive ? '#10b981' : '#ef4444' }}>{crypto.change}</span>
                <span style={{ color: '#334155' }} className="mx-2">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(245,158,11,0.05)' }} />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(139,92,246,0.05)' }} />

        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
              <Zap className="w-4 h-4" />
              Plateforme #1 en Afrique de l'Ouest
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Achetez, Vendez &<br />
              <span className="gradient-text">Échangez des Cryptos</span>
            </h1>

            <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#cbd5e1' }}>
              La plateforme crypto la plus sécurisée d'Afrique. Convertissez en FCFA, payez via Orange Money, MTN, Wave. Simple, rapide, sûr.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register" className="btn-primary text-lg py-4 px-8 gap-3">
                Commencer maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth/login" className="btn-secondary text-lg py-4 px-8">
                Se connecter
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto"
          >
            {[
              { label: 'Utilisateurs actifs', value: '50K+' },
              { label: 'Volume mensuel', value: '2.5B FCFA' },
              { label: 'Cryptos supportées', value: '12+' },
              { label: 'Pays couverts', value: '15+' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-6 text-center">
                <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-sm" style={{ color: '#94a3b8' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Supported Cryptos */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-3xl font-bold text-white mb-12">Cryptos Supportées</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {SUPPORTED_CRYPTOS.map((crypto) => (
              <motion.div
                key={crypto.symbol}
                whileHover={{ scale: 1.05, y: -4 }}
                className="glass-card-hover p-6 text-center cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-black text-black"
                  style={{ backgroundColor: crypto.color }}
                >
                  {crypto.symbol[0]}
                </div>
                <div className="text-sm font-bold text-white">{crypto.symbol}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" style={{ backgroundColor: 'rgba(15,23,42,0.3)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Pourquoi choisir CryptoXchange ?</h2>
            <p className="text-lg" style={{ color: '#cbd5e1' }}>Conçu pour l'Afrique, sécurisé pour le monde</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card-hover p-8"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <feature.icon className="w-6 h-6" style={{ color: '#fbbf24' }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Money Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(245,158,11,0.05), transparent)' }} />
            <h2 className="text-4xl font-black text-white mb-4 relative">
              Payez avec <span className="gradient-text">Mobile Money</span>
            </h2>
            <p className="text-lg mb-8 relative" style={{ color: '#cbd5e1' }}>
              Orange Money, MTN Mobile Money, Wave, Moov Money, Airtel Money
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {['Orange Money', 'MTN Money', 'Wave', 'Moov Money', 'Airtel Money'].map((provider) => (
                <div key={provider} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {provider}
                </div>
              ))}
            </div>
            <Link href="/auth/register" className="btn-primary inline-flex">
              Démarrer maintenant <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black text-white mb-6">
            Prêt à commencer ?<br />
            <span className="gradient-text">Créez votre compte gratuitement</span>
          </h2>
          <p className="text-xl mb-10" style={{ color: '#cbd5e1' }}>
            Rejoignez +50 000 utilisateurs qui font confiance à CryptoXchange
          </p>
          <Link href="/auth/register" className="btn-primary text-xl py-5 px-12">
            Créer mon compte <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Bitcoin className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-black gradient-text">CryptoXchange</span>
            </div>
            <div className="text-sm" style={{ color: '#94a3b8' }}>
              © 2024 CryptoXchange. Tous droits réservés. Plateforme sécurisée.
            </div>
            <div className="flex gap-6 text-sm">
              {['CGU', 'Confidentialité', 'Support'].map((item) => (
                <a key={item} href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
