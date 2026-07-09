import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'fluxo_db';
const DB_VERSION = 2;
const STORE_POCKETS = 'pockets';
const STORE_TRANSACTIONS = 'transactions';
const STORE_CATEGORIES = 'categories';

// Bolsillos iniciales, solo se usan la primera vez que se abre la app
const SEED_POCKETS = [
  { name: 'Binance', currency: 'USD', balance_cents: 0, color_key: 'binance' },
  { name: 'BNB', currency: 'BOB', balance_cents: 0, color_key: 'bank' },
  { name: 'BCP', currency: 'BOB', balance_cents: 0, color_key: 'bank' },
  { name: 'Ganadero', currency: 'BOB', balance_cents: 0, color_key: 'bank' },
  { name: 'Efectivo', currency: 'BOB', balance_cents: 0, color_key: 'cash' },
];

const SEED_CATEGORIES = [
  { name: 'Transporte', icon: '🚌' },
  { name: 'Almuerzo', icon: '🍽️' },
  { name: 'Gastos Hormiga', icon: '🐜' },
  { name: 'Salidas', icon: '🎉' },
];

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_POCKETS)) {
        db.createObjectStore(STORE_POCKETS, { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        const txStore = db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'local_id' });
        txStore.createIndex('synced', 'synced', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function getAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function put(db, storeName, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Hook principal de persistencia local. Carga los pockets desde IndexedDB
 * (o los siembra la primera vez), y expone funciones para aplicar movimientos.
 * Todo esto funciona sin conexion; useSyncEngine se encarga de subirlo despues.
 */
export function useIndexedDB() {
  const [db, setDb] = useState(null);
  const [pockets, setPockets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const database = await openDB();
        if (!mounted) return;
        setDb(database);

        const existingPockets = await getAll(database, STORE_POCKETS);
        const existingCategories = await getAll(database, STORE_CATEGORIES);

        if (existingPockets.length === 0) {
          for (const pocket of SEED_POCKETS) {
            await put(database, STORE_POCKETS, pocket);
          }
          const seeded = await getAll(database, STORE_POCKETS);
          if (mounted) setPockets(seeded);
        } else {
          if (mounted) setPockets(existingPockets);
        }

        if (existingCategories.length === 0) {
          for (const category of SEED_CATEGORIES) {
            await put(database, STORE_CATEGORIES, category);
          }
          const seededCategories = await getAll(database, STORE_CATEGORIES);
          if (mounted) setCategories(seededCategories);
        } else {
          if (mounted) setCategories(existingCategories);
        }
      } catch (err) {
        console.error('Error inicializando IndexedDB:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  const refreshPockets = useCallback(async () => {
    if (!db) return;
    const updated = await getAll(db, STORE_POCKETS);
    setPockets(updated);
  }, [db]);

  // Registra un gasto simple: descuenta de un pocket, guarda la transaccion
  const registerExpense = useCallback(async ({ amountCents, sourcePocketId, categoryId, note, receiptUrl }) => {
    if (!db) return;

    const allPockets = await getAll(db, STORE_POCKETS);
    const source = allPockets.find((p) => p.id === sourcePocketId);
    if (!source) throw new Error('Bolsillo de origen no encontrado');

    const updatedSource = { ...source, balance_cents: source.balance_cents - Math.abs(amountCents) };
    await put(db, STORE_POCKETS, updatedSource);

    const transaction = {
      local_id: crypto.randomUUID(),
      type: 'expense',
      amount_cents: -Math.abs(amountCents),
      source_pocket_id: sourcePocketId,
      destination_pocket_id: null,
      category_id: categoryId || null,
      exchange_rate_snapshot: null,
      note: note || '',
      receipt_url: receiptUrl || null,
      client_created_at: new Date().toISOString(),
      synced: false,
    };
    await put(db, STORE_TRANSACTIONS, transaction);

    await refreshPockets();
    return transaction;
  }, [db, refreshPockets]);

  // Registra un cambio P2P: vende USD de Binance, inyecta BOB en la cuenta destino, congela la tasa
  const registerP2PChange = useCallback(async ({ usdAmountCents, agreedRate, destinationPocketId }) => {
    if (!db) return;

    const allPockets = await getAll(db, STORE_POCKETS);
    const binance = allPockets.find((p) => p.name === 'Binance');
    const destination = allPockets.find((p) => p.id === destinationPocketId);
    if (!binance || !destination) throw new Error('Bolsillo no encontrado');

    const bobAmountCents = Math.round(usdAmountCents * agreedRate);

    const updatedBinance = { ...binance, balance_cents: binance.balance_cents - usdAmountCents };
    const updatedDestination = { ...destination, balance_cents: destination.balance_cents + bobAmountCents };

    await put(db, STORE_POCKETS, updatedBinance);
    await put(db, STORE_POCKETS, updatedDestination);

    const transaction = {
      local_id: crypto.randomUUID(),
      type: 'p2p_change',
      amount_cents: bobAmountCents,
      source_pocket_id: binance.id,
      destination_pocket_id: destinationPocketId,
      category_id: null,
      exchange_rate_snapshot: agreedRate,
      note: `Cambio P2P: ${usdAmountCents / 100} USD a tasa ${agreedRate}`,
      client_created_at: new Date().toISOString(),
      synced: false,
    };
    await put(db, STORE_TRANSACTIONS, transaction);

    await refreshPockets();
    return transaction;
  }, [db, refreshPockets]);

  // Traspaso interno BOB -> BOB, no computa como gasto real
  const registerInternalTransfer = useCallback(async ({ amountCents, sourcePocketId, destinationPocketId }) => {
    if (!db) return;

    const allPockets = await getAll(db, STORE_POCKETS);
    const source = allPockets.find((p) => p.id === sourcePocketId);
    const destination = allPockets.find((p) => p.id === destinationPocketId);
    if (!source || !destination) throw new Error('Bolsillo no encontrado');

    const updatedSource = { ...source, balance_cents: source.balance_cents - amountCents };
    const updatedDestination = { ...destination, balance_cents: destination.balance_cents + amountCents };

    await put(db, STORE_POCKETS, updatedSource);
    await put(db, STORE_POCKETS, updatedDestination);

    const transaction = {
      local_id: crypto.randomUUID(),
      type: 'internal_transfer',
      amount_cents: amountCents,
      source_pocket_id: sourcePocketId,
      destination_pocket_id: destinationPocketId,
      category_id: null,
      exchange_rate_snapshot: null,
      note: '',
      client_created_at: new Date().toISOString(),
      synced: false,
    };
    await put(db, STORE_TRANSACTIONS, transaction);

    await refreshPockets();
    return transaction;
  }, [db, refreshPockets]);

  // Ajuste de caja: fuerza el saldo de un bolsillo y registra la diferencia
  const registerCashAdjustment = useCallback(async ({ pocketId, newBalanceCents }) => {
    if (!db) return;

    const allPockets = await getAll(db, STORE_POCKETS);
    const pocket = allPockets.find((p) => p.id === pocketId);
    if (!pocket) throw new Error('Bolsillo no encontrado');

    const differenceCents = newBalanceCents - pocket.balance_cents;
    const updatedPocket = { ...pocket, balance_cents: newBalanceCents };
    await put(db, STORE_POCKETS, updatedPocket);

    const transaction = {
      local_id: crypto.randomUUID(),
      type: 'cash_adjustment',
      amount_cents: differenceCents,
      source_pocket_id: pocketId,
      destination_pocket_id: null,
      category_id: null,
      exchange_rate_snapshot: null,
      note: 'Ajuste de caja',
      client_created_at: new Date().toISOString(),
      synced: false,
    };
    await put(db, STORE_TRANSACTIONS, transaction);

    await refreshPockets();
    return transaction;
  }, [db, refreshPockets]);

  const getTransactionHistory = useCallback(async () => {
    if (!db) return [];
    const all = await getAll(db, STORE_TRANSACTIONS);
    return all.sort((a, b) => new Date(b.client_created_at) - new Date(a.client_created_at));
  }, [db]);

  // Descarga el estado del servidor y lo fusiona en IndexedDB.
  // Se usa al iniciar sesion, para que un dispositivo nuevo (o que perdio
  // su IndexedDB local) recupere lo que ya existe en Neon.
  const pullFromServer = useCallback(async (getToken) => {
    if (!db) return;

    try {
      const token = await getToken();
      const response = await fetch('/api/data', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Pull fallo con status ${response.status}`);

      const serverData = await response.json();

      // Pockets: el servidor es la fuente de verdad de balances
      // (ya reconciliados via /api/data POST), asi que sobreescribimos local
      for (const serverPocket of serverData.pockets) {
        const localMatch = (await getAll(db, STORE_POCKETS)).find(
          (p) => p.name === serverPocket.name && p.currency === serverPocket.currency
        );
        await put(db, STORE_POCKETS, {
          ...(localMatch ? { id: localMatch.id } : {}),
          name: serverPocket.name,
          currency: serverPocket.currency,
          balance_cents: serverPocket.balance_cents,
          color_key: serverPocket.color_key,
        });
      }

      // Categories: mismo criterio, servidor manda
      for (const serverCategory of serverData.categories) {
        const localMatch = (await getAll(db, STORE_CATEGORIES)).find(
          (c) => c.name === serverCategory.name
        );
        await put(db, STORE_CATEGORIES, {
          ...(localMatch ? { id: localMatch.id } : {}),
          name: serverCategory.name,
          icon: serverCategory.icon,
        });
      }

      // Transactions: solo agregamos las que no existen localmente
      // (evita pisar transacciones locales aun no sincronizadas)
      const localTransactions = await getAll(db, STORE_TRANSACTIONS);
      const localIds = new Set(localTransactions.map((t) => t.local_id));

      for (const serverTx of serverData.transactions) {
        if (!localIds.has(serverTx.local_id)) {
          await put(db, STORE_TRANSACTIONS, { ...serverTx, synced: true });
        }
      }

      await refreshPockets();
      const updatedCategories = await getAll(db, STORE_CATEGORIES);
      setCategories(updatedCategories);
    } catch (err) {
      console.error('Error descargando datos del servidor:', err);
    }
  }, [db, refreshPockets]);

  return {
    db,
    pockets,
    categories,
    isLoading,
    registerExpense,
    registerP2PChange,
    registerInternalTransfer,
    registerCashAdjustment,
    getTransactionHistory,
    refreshPockets,
    pullFromServer,
  };
}