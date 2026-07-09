import { useState } from 'react';
import HeaderTotal from '../components/HeaderTotal';
import PocketCard from '../components/PocketCard';
import QuickActionGrid from '../components/QuickActionGrid';
import TransactionModal from '../components/TransactionModal';
import { useExchangeRate } from '../hooks/useExchangeRate';
import './Dashboard.css';

export default function Dashboard({
  onOpenHistory,
  onOpenSettings,
  pockets,
  categories,
  isLoading,
  registerExpense,
  registerP2PChange,
  registerInternalTransfer,
  isOnline,
  isSyncing,
}) {
  const { rate, updateRate } = useExchangeRate();
  const [feedback, setFeedback] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false); // Estado elevado aquí para controlar toda la app

  const handleQuickAction = async (action) => {
    const efectivo = pockets.find((p) => p.name === 'Efectivo');
    if (!efectivo) return;

    const matchingCategory = categories.find((c) => c.name === action.categoryName);

    try {
      await registerExpense({
        amountCents: action.amountCents,
        sourcePocketId: efectivo.id,
        categoryId: matchingCategory ? matchingCategory.id : null,
        note: action.categoryName,
      });
      setFeedback(`Registrado: ${action.label}`);
      setTimeout(() => setFeedback(''), 2000);
    } catch (err) {
      console.error('Error registrando gasto rapido:', err);
    }
  };

  const handleOpenFullForm = () => {
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="app-screen">
        <div className="loading-state">
          <span className="loading-spinner" />
          Sincronizando tus cuentas...
        </div>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <HeaderTotal
        pockets={pockets}
        exchangeRate={rate}
        onRateChange={updateRate}
        onOpenHistory={onOpenHistory}
        onOpenSettings={onOpenSettings}
        isOnline={isOnline}
        isSyncing={isSyncing}
        isPrivate={isPrivate}
        setIsPrivate={setIsPrivate}
      />

      <div className="scroll-container">
        {feedback && <div className="feedback-toast">{feedback}</div>}
        {pockets.map((pocket) => (
          <PocketCard key={pocket.id} pocket={pocket} isPrivate={isPrivate} />
        ))}
      </div>

      <div className="bottom-dock">
        <QuickActionGrid onQuickAction={handleQuickAction} />
        <button className="main-action-btn" onClick={handleOpenFullForm}>
          + Registrar movimiento
        </button>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pockets={pockets}
        categories={categories}
        onRegisterExpense={registerExpense}
        onRegisterP2PChange={registerP2PChange}
        onRegisterInternalTransfer={registerInternalTransfer}
      />
    </div>
  );
}