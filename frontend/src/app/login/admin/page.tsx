'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '@/components/ui/Logo';

export default function AdminLoginPage() {
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
      setError('Invalid admin credentials or not an admin user.');
      setLoading(false);
    } else {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (session?.user) {
        login({ id: session.user.id, email: session.user.email, name: session.user.name, memberSince: new Date().toISOString(), isAdmin: true });
        router.push('/admin-dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Admin Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-red)]/10 mb-4">
            <Shield className="w-8 h-8 text-[var(--accent-red)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Admin Portal
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Restricted access for authorized administrators only
          </p>
        </motion.div>

        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-3 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0" />
          <p className="text-xs text-[var(--text-secondary)]">
            This area is restricted to game administrators. Unauthorized access attempts are logged.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-5 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)] transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)] transition-all outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-[var(--accent-red)]"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--accent-red)] text-white font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield size={18} />
                Admin Login
              </span>
            )}
          </button>
        </motion.form>

        {/* Back to player login */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-[var(--text-dim)]"
        >
          <a href="/login" className="text-[var(--accent-blue)] hover:underline">
            Back to Player Login
          </a>
        </motion.p>

        {/* Demo credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 p-3 rounded-lg bg-[var(--bg-surface)]/50 border border-[var(--border-color)] text-center"
        >
          <p className="text-xs text-[var(--text-dim)] mb-2">Demo Credentials</p>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            omkar@example.com / omkar123
          </p>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            admin@example.com / adminpassword
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
