import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';

export function useInitialData() {
  const { negocioId } = useAuth();
  const fetchClientes = useStore((s) => s.fetchClientes);
  const fetchPedidos = useStore((s) => s.fetchPedidos);
  const fetchProductos = useStore((s) => s.fetchProductos);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!negocioId) return;

    let cancelado = false;
    setReady(false);
    setError(null);

    Promise.all([fetchClientes(), fetchPedidos(), fetchProductos()])
      .catch((e) => {
        console.error('Error cargando datos iniciales', e);
        if (!cancelado) setError('No se pudieron cargar los datos. Revisá tu conexión.');
      })
      .finally(() => {
        if (!cancelado) setReady(true);
      });

    return () => {
      cancelado = true;
    };
  }, [negocioId, fetchClientes, fetchPedidos, fetchProductos]);

  return { ready, error };
}
