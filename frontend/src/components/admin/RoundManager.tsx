'use client';

import { useState } from 'react';
import { Loader2, Play, Pause, Save, Calendar, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const ADMIN_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/admin';

interface RoundConfigRules {
  noShortSelling: boolean;
  noInsiderTrading: boolean;
}

export default function RoundManager() {
  const user = useAuthStore((state) => state.user);
  const token = user?.id;

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const [roundNo, setRoundNo] = useState(1);
  const [duration, setDuration] = useState(10);
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  
  const [rules, setRules] = useState<RoundConfigRules>({
    noShortSelling: false,
    noInsiderTrading: false,
  });

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSaveConfig = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = {
        roundNo,
        duration,
        rules,
        scheduledStartTime: scheduledStartTime || undefined
      };

      const res = await fetch(`${ADMIN_URL}/rounds/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.status === 'Success') {
        showMsg(`Round ${roundNo} Configured Successfully`, 'success');
      } else {
        showMsg(`Failed: ${data.message}`, 'error');
      }
    } catch (err: any) {
      showMsg(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const gameAction = async (endpoint: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}/game/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'Success') {
        showMsg(`Game ${endpoint}ed`, 'success');
      } else {
        showMsg(`Failed to ${endpoint}`, 'error');
      }
    } catch (err: any) {
      showMsg(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-lg mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-[var(--accent-blue)]" size={24} />
            Round Manager
        </h2>
        <div className="flex gap-3">
            <button 
                onClick={() => gameAction('pause')} 
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-yellow-500/50 text-yellow-500 rounded-xl hover:bg-yellow-500/10 transition-colors text-sm font-medium"
            >
                <Pause size={16} /> Pause
            </button>
            <button 
                onClick={() => gameAction('resume')} 
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-green-500/50 text-green-500 rounded-xl hover:bg-green-500/10 transition-colors text-sm font-medium"
            >
                <Play size={16} /> Resume
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Round Number</label>
            <input 
              type="number" 
              value={roundNo} 
              onChange={(e) => setRoundNo(parseInt(e.target.value))} 
              className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Duration (Minutes)</label>
            <input 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(parseInt(e.target.value))} 
              className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none"
            />
          </div>
      </div>

      <div className="mb-6">
         <label className="text-sm font-medium text-[var(--text-secondary)]">Scheduled Start Time (Optional)</label>
         <div className="flex gap-2 items-center mt-2">
            <input 
               type="datetime-local" 
               value={scheduledStartTime}
               onChange={(e) => setScheduledStartTime(e.target.value)}
               className="flex-1 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--text-primary)]"
            />
         </div>
         <p className="text-xs text-[var(--text-secondary)] mt-1">Leave empty to effectively start immediately upon saving, or use the Start Game button elsewhere.</p>
      </div>

      <div className="mb-6 bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)]">
          <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Active Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                        type="checkbox"
                        checked={rules.noShortSelling}
                        onChange={(e) => setRules({...rules, noShortSelling: e.target.checked})}
                        className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:bg-[var(--accent-red)] peer-focus:ring-2 peer-focus:ring-[var(--accent-red)] transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-4"></div>
                  </div>
                  <span className="text-sm font-medium group-hover:text-[var(--text-primary)] transition-colors">Disable Short Selling</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                        type="checkbox"
                        checked={rules.noInsiderTrading}
                        onChange={(e) => setRules({...rules, noInsiderTrading: e.target.checked})}
                        className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:bg-[var(--accent-red)] peer-focus:ring-2 peer-focus:ring-[var(--accent-red)] transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-4"></div>
                  </div>
                  <span className="text-sm font-medium group-hover:text-[var(--text-primary)] transition-colors">Disable Insider Trading</span>
              </label>
          </div>
      </div>

      <div className="flex flex-col gap-4">
        {msg && (
            <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                {msg.text}
            </div>
        )}
        
        <button 
          onClick={handleSaveConfig} 
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 bg-[var(--accent-blue)] hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Configuration & Schedule
        </button>
      </div>
    </div>
  );
}
