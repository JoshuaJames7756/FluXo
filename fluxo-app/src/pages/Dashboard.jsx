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
  const [isPrivate, setIsPrivate] = useState(false);
  // Bloqueo de UI local para evitar registrar transacciones duplicadas por error táctil
  const [isProcessingQuickAction, setIsProcessingQuickAction] = useState(false);

  const handleQuickAction = async (action) => {
    if (isProcessingQuickAction) return; // Congela la acción inmediata si ya hay una en curso

    const efectivo = pockets.find((p) => p.name === 'Efectivo');
    if (!efectivo) return;

    const matchingCategory = categories.find((c) => c.name === action.categoryName);

    try {
      setIsProcessingQuickAction(true);
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
    } finally {
      setIsProcessingQuickAction(false);
    }
  };

  const handleOpenFullForm = () => {
    setIsModalOpen(true);
  };

  // RENDER SKELETON: Mantiene la estructura del dashboard idéntica mientras carga
  if (isLoading) {
    return (
      <div className="app-screen dashboard-loading-state">
        <div className="skeleton-header-total"></div>
        <div className="scroll-container" style={{ paddingBottom: 180 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="pocket-card-skeleton">
              <div className="skeleton-line pocket-title-sk"></div>
              <div className="skeleton-line pocket-balance-sk"></div>
            </div>
          ))}
        </div>
        <div className="bottom-dock-skeleton"></div>
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

      <div className={`scroll-container ${isProcessingQuickAction ? 'ui-disabled' : ''}`}>
        {feedback && <div className="feedback-toast">{feedback}</div>}
        {pockets.map((pocket) => (
          <PocketCard key={pocket.id} pocket={pocket} isPrivate={isPrivate} />
        ))}
      </div>

      <div className="bottom-dock">
        <QuickActionGrid onQuickAction={handleQuickAction} />
        <button 
          className="main-action-btn" 
          onClick={handleOpenFullForm}
          disabled={isProcessingQuickAction}
        >
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