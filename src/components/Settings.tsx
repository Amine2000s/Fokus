import { useFokus } from '@/store/FokusContext';
import { Moon, Sun, Shield, Palette, Volume2, VolumeX } from 'lucide-react';
import { Theme } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const { state, dispatch, toggleSound } = useFokus();

  const setTheme = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Customize your experience</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm">Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('midnight')}
              className={`relative flex flex-col gap-3 p-4 rounded-lg border text-left transition-all ${
                state.theme === 'midnight'
                  ? 'border-primary/40 ring-1 ring-primary/20 bg-primary/[0.03]'
                  : 'bg-muted border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0c0c0e] border border-[#222225] flex items-center justify-center text-[#3b82f6]">
                  <Moon className="w-3.5 h-3.5" />
                </div>
                {state.theme === 'midnight' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Midnight</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Warm dark with blue accents</p>
              </div>
            </button>

            <button
              onClick={() => setTheme('paper')}
              className={`relative flex flex-col gap-3 p-4 rounded-lg border text-left transition-all ${
                state.theme === 'paper'
                  ? 'border-primary/40 ring-1 ring-primary/20 bg-primary/[0.03]'
                  : 'bg-muted border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f7f6f2] border border-[#e4e2d9] flex items-center justify-center text-[#ae5630]">
                  <Sun className="w-3.5 h-3.5" />
                </div>
                {state.theme === 'paper' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Paper</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Warm cream, soft ink</p>
              </div>
            </button>

            <button
              onClick={() => setTheme('obsidian')}
              className={`relative flex flex-col gap-3 p-4 rounded-lg border text-left transition-all ${
                state.theme === 'obsidian'
                  ? 'border-primary/40 ring-1 ring-primary/20 bg-primary/[0.03]'
                  : 'bg-muted border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center text-white">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                {state.theme === 'obsidian' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Obsidian</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">OLED black, glass accents</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {state.soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
            <CardTitle className="text-sm">Sounds & Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Session Sounds</p>
              <p className="text-xs text-muted-foreground mt-0.5">Play chimes when sessions start and end</p>
            </div>
            <button
              onClick={toggleSound}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                state.soundEnabled ? 'bg-primary' : 'bg-muted border border-border'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                state.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm">Privacy & Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Local Storage Only</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your data never leaves your browser.</p>
              </div>
              <Badge variant="secondary" className="text-[10px] px-2 py-0">Active</Badge>
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                if (confirm('Are you sure? This will delete all activities, tasks, and history permanently.')) {
                  indexedDB.deleteDatabase('fokus-db');
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
