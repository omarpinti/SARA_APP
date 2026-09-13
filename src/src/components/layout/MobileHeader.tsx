import { Droplets, LogOut } from 'lucide-react';
import { SyncStatus } from '@/components/SyncStatus';
import { useAuth } from '@/contexts/AuthContext';

export function MobileHeader() {
  const { signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center justify-between px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Droplets className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-lg">Sara APP</h1>
      </div>
      <div className="flex items-center gap-3">
        <SyncStatus />
        <button onClick={signOut} aria-label="Cerrar sesión" className="text-muted-foreground">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
