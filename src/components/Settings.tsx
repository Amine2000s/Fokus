import { useFokus } from '@/store/FokusContext';
import { Moon, Sun, Settings as SettingsIcon, Shield, Palette } from 'lucide-react';
import { Theme } from '@/types';

export default function Settings() {
  const { state, dispatch } = useFokus();

  const setTheme = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-sm text-app-secondary mt-1">Customize your focus environment</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-app-card border border-app-subtle flex items-center justify-center text-app-secondary">
          <SettingsIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-app-card rounded-[2rem] border border-app-subtle p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-5 h-5 text-app-accent" />
          <h3 className="text-lg font-bold">Appearance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Midnight Theme */}
          <button
            onClick={() => setTheme('midnight')}
            className={`flex flex-col gap-4 p-6 rounded-2xl border transition-all text-left ${
              state.theme === 'midnight'
                ? 'bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/20'
                : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#0a0e17] border border-white/10 flex items-center justify-center text-blue-500">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Midnight</p>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">High-performance dark mode with blue accents.</p>
            </div>
          </button>

          {/* Paper Theme (Claude-style) */}
          <button
            onClick={() => setTheme('paper')}
            className={`flex flex-col gap-4 p-6 rounded-2xl border transition-all text-left ${
              state.theme === 'paper'
                ? 'bg-[#ae5630]/10 border-[#ae5630]/50 ring-2 ring-[#ae5630]/20'
                : 'bg-[#f3f2ef] border-black/5 hover:border-black/10'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#f9f8f6] border border-black/5 flex items-center justify-center text-[#ae5630]">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[#1d1d1b] font-serif">Paper</p>
              <p className="text-[11px] text-[#6b6b6b] mt-1 leading-relaxed">Refined, minimalist aesthetic inspired by Claude.</p>
            </div>
          </button>

          {/* Obsidian Theme (macOS-style) */}
          <button
            onClick={() => setTheme('obsidian')}
            className={`flex flex-col gap-4 p-6 rounded-2xl border transition-all text-left ${
              state.theme === 'obsidian'
                ? 'bg-white text-black ring-4 ring-white/10'
                : 'bg-black border-white/10 hover:border-white/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl ${
              state.theme === 'obsidian' ? 'bg-black text-white' : 'bg-white text-black'
            }`}>
              <Shield className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className={`font-bold tracking-tight ${state.theme === 'obsidian' ? 'text-black' : 'text-white'}`}>Obsidian</p>
              <p className={`text-[11px] mt-1 leading-relaxed ${state.theme === 'obsidian' ? 'text-black/60' : 'text-zinc-500'}`}>
                OLED Pure Black. Ultra-sharp white accents. Glassmorphism.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="bg-app-card rounded-[2rem] border border-app-subtle p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-app-accent" />
          <h3 className="text-lg font-bold">Privacy & Data</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-app-dark/50 rounded-xl border border-app-subtle">
            <div>
              <p className="text-sm font-bold">Local Storage Only</p>
              <p className="text-xs text-app-secondary">Your data never leaves your browser.</p>
            </div>
            <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Active</div>
          </div>
          
          <button 
            onClick={() => {
              if (confirm('Are you sure? This will delete all activities, tasks, and history permanently.')) {
                indexedDB.deleteDatabase('fokus-db');
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="w-full py-4 rounded-xl border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-widest hover:bg-rose-500/10 transition-all"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
