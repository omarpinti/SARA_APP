import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SyncStatus() {
  const { isOnline, isLoading, syncError, syncFromSheets, setOnlineMode } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Auto-sync on first mount
    if (!isInitialized) {
      setIsInitialized(true);
      handleSync();
    }
  }, [isInitialized]);

  const handleSync = async (): Promise<boolean> => {
    try {
      await syncFromSheets();
      toast.success('Datos sincronizados con Google Sheets');
      return true;
    } catch (error) {
      toast.error('Error al sincronizar');
      return false;
    }
  };

  const toggleMode = async () => {
    if (isOnline) {
      setOnlineMode(false);
      toast.info('Modo offline activado');
      return;
    }

    setOnlineMode(true);

    const ok = await handleSync();
    if (ok) {
      toast.success('Modo online activado');
    } else {
      setOnlineMode(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSync}
        disabled={isLoading}
        className="h-9 w-9"
        title="Sincronizar con Google Sheets"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMode}
        className={`h-9 gap-2 text-xs ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}
        title={isOnline ? 'Conectado - Click para modo offline' : 'Offline - Click para conectar'}
      >
        {isOnline ? (
          <>
            <Cloud className="h-4 w-4" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <CloudOff className="h-4 w-4" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
      </Button>
    </div>
  );
}
