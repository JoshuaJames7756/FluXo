import { useState, useEffect } from 'react';
import { centsToDisplay } from '../lib/money';
import './History.css';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'expense', label: 'Gastos Reales' },
  { key: 'internal', label: 'Traspasos/Cambios' },
];

const TYPE_LABELS = {
  expense: 'Gasto',
  p2p_change: 'Cambio P2P',
  internal_transfer: 'Traspaso',
  cash_adjustment: 'Ajuste de caja',
};

export default function History({ getTransactionHistory, pockets, categories, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getTransactionHistory();
      setTransactions(data);
      setIsLoading(false);
    }
    load();
  }, [getTransactionHistory]);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'expense') return tx.type === 'expense';
    if (activeFilter === 'internal') return tx.type === 'p2p_change' || tx.type === 'internal_transfer' || tx.type === 'cash_adjustment';
    return true;
  });

  const getPocketName = (id) => pockets.find((p) => p.id === id)?.name || '—';
  const getCategoryLabel = (id) => {
    const category = categories.find((c) => c.id === id);
    return category ? `${category.icon} ${category.name}` : null;
  };

  return (
    <div className="app-screen">
      <header className="history-header">
        <button className="back-btn" onClick={onBack} aria-label="Volver">←</button>
        <span className="history-title">Historial</span>
        <span style={{ width: 36 }} />
      </header>

      <div className="history-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-chip ${activeFilter === f.key ? 'is-active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="scroll-container history-list">
        {isLoading && <p className="history-empty">Cargando...</p>}

        {!isLoading && filteredTransactions.length === 0 && (
          <p className="history-empty">No hay movimientos en esta categoría.</p>
        )}

        {filteredTransactions.map((tx) => {
          const isExpenseType = tx.type === 'expense';
          const amountColor = isExpenseType
            ? 'var(--color-expense)'
            : tx.type === 'p2p_change'
            ? 'var(--color-binance)'
            : 'var(--text-main)';
          const sign = tx.amount_cents < 0 ? '' : '+';
          const currency = tx.type === 'p2p_change' ? 'BOB' : (pockets.find(p => p.id === tx.source_pocket_id)?.currency || 'BOB');

          return (
            <div key={tx.local_id} className="history-item">
              <div className="history-item-main">
                <span className="history-item-type">{TYPE_LABELS[tx.type]}</span>
                <span className="history-item-detail">
                  {tx.type === 'expense' && getCategoryLabel(tx.category_id)}
                  {tx.type === 'expense' && ` · ${getPocketName(tx.source_pocket_id)}`}
                  {tx.type === 'p2p_change' && `Binance → ${getPocketName(tx.destination_pocket_id)} @ ${tx.exchange_rate_snapshot}`}
                  {tx.type === 'internal_transfer' && `${getPocketName(tx.source_pocket_id)} → ${getPocketName(tx.destination_pocket_id)}`}
                  {tx.type === 'cash_adjustment' && `Ajuste en ${getPocketName(tx.source_pocket_id)}`}
                </span>
                {tx.note && <span className="history-item-note">{tx.note}</span>}
                {tx.receipt_url && (
                  <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="history-item-receipt">
                    📷 Ver recibo
                  </a>
                )}
              </div>
              <span className="history-item-amount" style={{ color: amountColor }}>
                {sign}{centsToDisplay(Math.abs(tx.amount_cents), currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}