import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, Phone, Loader2, Check } from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';
import { authAPI } from '@/lib/api';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  username: z.string().min(3, 'Username requis (min 3 caractères)').max(30),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Min 8 caractères').regex(/[A-Z]/, 'Une majuscule requise').regex(/[a-z]/, 'Une minuscule requise').regex(/\d/, 'Un chiffre requis'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(v => v, 'Vous devez accepter les CGU'),
}).refine(d => d.password === d.confirmPassword, { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await authAPI.register({ firstName: data.firstName, lastName: data.lastName, username: data.username, email: data.email, phone: data.phone, password: data.password });
      toast.success('Compte créé ! Vérifiez votre email.');
      setLocation('/auth/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dots flex items-center justify-center p-4 py-12" style={{ backgroundColor: '#080d1a' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(245,158,11,0.05)' }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg relative">
        <Link href="/" className="flex items-center justify-center mb-8" style={{ textDecoration: 'none' }}>
          <PremiumLogo size={38} textSize={22} />
        </Link>
        <div className="glass-card p-8">
          <h1 className="text-2xl font-black text-white mb-2">Créer un compte 🚀</h1>
          <p className="mb-8" style={{ color: '#94a3b8' }}>Rejoignez +50 000 traders</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Prénom</label>
                <input {...register('firstName')} placeholder="Jean" className="input-field" />
                {errors.firstName && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Nom</label>
                <input {...register('lastName')} placeholder="Dupont" className="input-field" />
                {errors.lastName && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Nom d'utilisateur</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
                <input {...register('username')} placeholder="jeandupont" className="input-field pl-11" />
              </div>
              {errors.username && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.username.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
                <input {...register('email')} type="email" placeholder="vous@exemple.com" className="input-field pl-11" />
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Téléphone (optionnel)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
                <input {...register('phone')} type="tel" placeholder="+225 07 00 00 00 00" className="input-field pl-11" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-11 pr-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {[{ key: 'length', label: '8+ caractères' }, { key: 'uppercase', label: 'Majuscule' }, { key: 'lowercase', label: 'Minuscule' }, { key: 'number', label: 'Chiffre' }].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-1 text-xs" style={{ color: passwordChecks[key as keyof typeof passwordChecks] ? '#10b981' : '#64748b' }}>
                      <Check className="w-3 h-3" /> {label}
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
                <input {...register('confirmPassword')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-11" />
              </div>
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.confirmPassword.message}</p>}
            </div>
            <div className="flex items-start gap-3">
              <input {...register('terms')} type="checkbox" id="terms" style={{ marginTop: '4px', width: '16px', height: '16px', accentColor: '#f59e0b' }} />
              <label htmlFor="terms" className="text-sm" style={{ color: '#94a3b8' }}>
                J'accepte les <Link href="/terms" style={{ color: '#fbbf24', textDecoration: 'none' }}>CGU</Link> et la <Link href="/privacy" style={{ color: '#fbbf24', textDecoration: 'none' }}>politique de confidentialité</Link>
              </label>
            </div>
            {errors.terms && <p className="text-xs" style={{ color: '#ef4444' }}>{errors.terms.message}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Création...</> : 'Créer mon compte'}
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color: '#94a3b8' }}>
            Déjà un compte ? <Link href="/auth/login" className="font-medium" style={{ color: '#fbbf24', textDecoration: 'none' }}>Se connecter</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
