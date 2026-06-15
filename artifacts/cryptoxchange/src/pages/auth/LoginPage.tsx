import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Bitcoin, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  totpCode: z.string().optional(),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await authAPI.login(data);
      const { data: result } = response.data;
      if (result.require2FA) {
        setRequire2FA(true);
        toast('Entrez votre code 2FA', { icon: '🔐' });
        setLoading(false);
        return;
      }
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success('Connexion réussie !');
      if (result.user.role === 'ADMIN' || result.user.role === 'SUPER_ADMIN') {
        setLocation('/admin/dashboard');
      } else {
        setLocation('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dots flex items-center justify-center p-4" style={{ backgroundColor: '#080d1a' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(245,158,11,0.05)' }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8" style={{ textDecoration: 'none' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Bitcoin className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-black gradient-text">CryptoXchange</span>
        </Link>
        <div className="glass-card p-8">
          <h1 className="text-2xl font-black text-white mb-2">Bon retour 👋</h1>
          <p className="mb-8" style={{ color: '#94a3b8' }}>Connectez-vous à votre compte</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
                <input {...register('email')} type="email" placeholder="vous@exemple.com" className="input-field pl-11" autoComplete="email" />
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-11 pr-11" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password.message}</p>}
            </div>
            {require2FA && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Code 2FA</label>
                <input {...register('totpCode')} type="text" placeholder="000000" maxLength={6} className="input-field text-center text-xl font-mono" style={{ letterSpacing: '0.5em' }} />
              </motion.div>
            )}
            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm" style={{ color: '#fbbf24', textDecoration: 'none' }}>Mot de passe oublié ?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</> : 'Se connecter'}
            </button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div className="relative flex justify-center text-xs px-4" style={{ color: '#94a3b8' }}>Pas encore de compte ?</div>
          </div>
          <Link href="/auth/register" className="btn-secondary w-full justify-center" style={{ display: 'flex' }}>Créer un compte</Link>
        </div>
      </motion.div>
    </div>
  );
}
