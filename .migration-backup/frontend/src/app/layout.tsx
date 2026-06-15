import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CryptoXchange — Plateforme d\'échange de cryptomonnaies',
  description: 'Achetez, vendez et échangez des cryptomonnaies en toute sécurité. Conversion FCFA, Mobile Money Orange, MTN, Wave. Interface professionnelle de niveau fintech.',
  keywords: 'cryptomonnaie, bitcoin, ethereum, FCFA, mobile money, Orange Money, MTN, échange crypto, plateforme crypto Afrique',
  openGraph: {
    title: 'CryptoXchange',
    description: 'La plateforme crypto de référence en Afrique de l\'Ouest',
    type: 'website',
  },
  themeColor: '#f59e0b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans bg-dark-950 text-white antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
