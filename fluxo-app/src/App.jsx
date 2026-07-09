import { useState, useEffect, useRef } from 'react';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import './assets/css/global.css';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import AuthScreen from './pages/AuthScreen';
import { useIndexedDB } from './hooks/useIndexedDB';
import { useSyncEngine } from './hooks/useSyncEngine';

function AuthenticatedApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { getToken } = useAuth();
  const hasPulled = useRef(false);
  
  // Extraemos txCount aquí para que esté disponible en el ámbito del componente
  const {
    db,
    pockets,
    categories,
    isLoading,
    txCount, // <--- CORRECCIÓN: Ahora sí lo extraemos de IndexedDB
    registerExpense,
    registerP2PChange,
    registerInternalTransfer,
    registerCashAdjustment,
    getTransactionHistory,
    pullFromServer,
  } = useIndexedDB();

  // Ahora useSyncEngine lo recibe de forma reactiva sin romper la app
  const { isOnline, isSyncing } = useSyncEngine({ db, txCount });

  // Al iniciar sesion, si hay conexion, descargamos una vez lo que exista
  // en el servidor y lo fusionamos con IndexedDB (multi dispositivo real)
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    async function runPull() {
      if (db && !isLoading && !hasPulled.current && navigator.onLine) {
        hasPulled.current = true;
        setIsPulling(true);
        await pullFromServer(getToken);
        setIsPulling(false);
      }
    }
    runPull();
  }, [db, isLoading, pullFromServer, getToken]);

  if (currentPage === 'history' && !isPulling) {
    return (
      <History
        getTransactionHistory={getTransactionHistory}
        pockets={pockets}
        categories={categories}
        onBack={() => setCurrentPage('dashboard')}
      />
    );
  }

  if (currentPage === 'settings' && !isPulling) {
    return (
      <Settings
        pockets={pockets}
        registerCashAdjustment={registerCashAdjustment}
        onBack={() => setCurrentPage('dashboard')}
      />
    );
  }

  return (
    <Dashboard
      pockets={pockets}
      categories={categories}
      isLoading={isLoading || isPulling}
      registerExpense={registerExpense}
      registerP2PChange={registerP2PChange}
      registerInternalTransfer={registerInternalTransfer}
      registerCashAdjustment={registerCashAdjustment}
      onOpenHistory={() => setCurrentPage('history')}
      onOpenSettings={() => setCurrentPage('settings')}
      isOnline={isOnline}
      isSyncing={isSyncing}
    />
  );
}

function App() {
  return (
    <>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
      <SignedOut>
        <AuthScreen />
      </SignedOut>
    </>
  );
}

export default App;