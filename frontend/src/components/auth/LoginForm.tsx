'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, TrendingUp, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '@/components/ui/Logo';
import { signIn } from 'next-auth/react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError('Invalid credentials.');
      setLoading(false);
    } else {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (session?.user) {
        const isAdmin = session.user.isAdmin;
        login({ id: session.user.id, email: session.user.email, name: session.user.name, memberSince: new Date().toISOString(), isAdmin });
        router.push(isAdmin ? '/admin-dashboard' : '/home');
      }
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setEmail('admin@fec.com');
    setPassword('admin1234');
    
    const res = await signIn('credentials', {
      redirect: false,
      email: 'admin@fec.com',
      password: 'admin', // assuming simple password for demo
    });

    if (res?.error) {
       // fallback generic error
       setError('Demo server unavailable.');
       setLoading(false);
    } else {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (session?.user) {
        login({ id: session.user.id, email: session.user.email, name: session.user.name, memberSince: new Date().toISOString() });
        router.push('/home');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10 flex flex-col items-center"
      >
        <Logo className="mb-4 scale-125" />
        <p className="text-[var(--text-secondary)] text-sm">
          Virtual Stock Market Platform
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="demo@fec.com"
            className="w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-[var(--accent-red)]"
          >
            {error}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 pt-2"
        >
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--accent-blue)] text-white font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-3 rounded-lg border border-[var(--accent-green)]/30 text-[var(--accent-green)] font-medium hover:bg-[var(--accent-green)]/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            Demo Mode
          </button>
        </motion.div>
      </form>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 text-center text-xs text-[var(--text-dim)]"
      >
        Use <span className="text-[var(--text-secondary)] font-mono">admin@fec.com</span> / <span className="text-[var(--text-secondary)] font-mono">admin</span>
      </motion.p>
    </motion.div>
  );
}
