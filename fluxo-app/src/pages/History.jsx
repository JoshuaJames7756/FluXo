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
    <div className="app-screen history-screen">
      <header className="history-header">
        <button className="back-btn" onClick={onBack} aria-label="Volver">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <span className="history-title">Historial de Movimientos</span>
        <span style={{ width: 30 }} />
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
        {isLoading && (
          <div className="history-empty">
            <p>Cargando transacciones...</p>
          </div>
        )}

        {!isLoading && filteredTransactions.length === 0 && (
          <div className="history-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>No hay movimientos registrados en esta categoría.</p>
          </div>
        )}

        {!isLoading && filteredTransactions.map((tx) => {
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
                <div className="history-item-top-row">
                  <span className="history-item-type">{TYPE_LABELS[tx.type]}</span>
                  {tx.receipt_url && (
                    <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="history-item-receipt" title="Ver recibo adjunto">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Recibo
                    </a>
                  )}
                </div>
                
                <span className="history-item-detail">
                  {tx.type === 'expense' && getCategoryLabel(tx.category_id)}
                  {tx.type === 'expense' && ` · ${getPocketName(tx.source_pocket_id)}`}
                  {tx.type === 'p2p_change' && `Binance → ${getPocketName(tx.destination_pocket_id)} @ ${tx.exchange_rate_snapshot}`}
                  {tx.type === 'internal_transfer' && `${getPocketName(tx.source_pocket_id)} → ${getPocketName(tx.destination_pocket_id)}`}
                  {tx.type === 'cash_adjustment' && `Ajuste en ${getPocketName(tx.source_pocket_id)}`}
                </span>
                
                {tx.note && <span className="history-item-note">{tx.note}</span>}
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