import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

export function useSyncEngine({ db, txCount = 0, storeName = 'transactions' }) {
  const { getToken, isSignedIn } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState(null);
  const intervalRef = useRef(null);

  const getPendingTransactions = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!db) return resolve([]);
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const pending = request.result.filter((t) => t.synced === false);
        resolve(pending);
      };
      request.onerror = () => reject(request.error);
    });
  }, [db, storeName]);

  const markAsSynced = useCallback((localIds) => {
    return new Promise((resolve, reject) => {
      if (!db || localIds.length === 0) return resolve();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      let remaining = localIds.length;
      localIds.forEach((localId) => {
        const getRequest = store.get(localId);
        getRequest.onsuccess = () => {
          const record = getRequest.result;
          if (record) {
            record.synced = true;
            store.put(record);
          }
          remaining -= 1;
          if (remaining === 0) resolve();
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    });
  }, [db, storeName]);

  const syncNow = useCallback(async () => {
    if (!isSignedIn || !navigator.onLine || !db || isSyncing) return;

    setIsSyncing(true);
    setLastSyncError(null);

    try {
      const pending = await getPendingTransactions();

      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      const token = await getToken();

      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactions: pending }),
      });

      if (!response.ok) {
        throw new Error(`Sync falló con status ${response.status}`);
      }

      const data = await response.json();
      const syncedIds = data.results
        .filter((r) => r.status === 'synced' || r.status === 'skipped_older')
        .map((r) => r.local_id);

      await markAsSynced(syncedIds);
    } catch (err) {
      console.error('Error sincronizando:', err);
      setLastSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [isSignedIn, db, isSyncing, getPendingTransactions, markAsSynced, getToken]);

  // Escucha cambios de red de la API del navegador
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  // Sincronización proactiva instantánea al detectar un cambio de transacción local (txCount)
  useEffect(() => {
    if (txCount > 0 && isOnline) {
      syncNow();
    }
  }, [txCount, isOnline, syncNow]);

  // Reintento periódico en segundo plano cada 60s
  useEffect(() => {
    if (isSignedIn && isOnline) {
      intervalRef.current = setInterval(syncNow, 60000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSignedIn, isOnline, syncNow]);

  // Sync de seguridad inicial al montar la sesión
  useEffect(() => {
    if (isSignedIn && db) {
      syncNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, db]);

  return { isOnline, isSyncing, lastSyncError, syncNow };
}