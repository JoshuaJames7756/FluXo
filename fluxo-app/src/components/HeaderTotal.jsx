import { useState } from 'react';
import PrivacyBlur from './PrivacyBlur';
import { centsToDisplay, calculateGrandTotal } from '../lib/money';
import './HeaderTotal.css';

export default function HeaderTotal({ pockets, exchangeRate, onRateChange, onOpenHistory, onOpenSettings, isOnline, isSyncing, isPrivate, setIsPrivate }) {
  const [rateInput, setRateInput] = useState(exchangeRate.toString());

  const grandTotalCents = calculateGrandTotal(pockets, exchangeRate);

  const handleRateBlur = () => {
    onRateChange(rateInput);
  };

  const statusLabel = isSyncing ? 'Sincronizando...' : isOnline ? 'En línea' : 'Sin conexión';
  const statusColor = isSyncing ? 'var(--color-binance)' : isOnline ? 'var(--color-primary)' : 'var(--color-expense)';

  return (
    <header className="header-total">
      <div className="header-top-row">
        <div className="app-name-wrapper">
          <span className="app-name">FluXo</span>
          <span className="sync-status" style={{ color: statusColor }}>
            <span className="sync-dot" style={{ backgroundColor: statusColor }} />
            {statusLabel}
          </span>
        </div>
        <div className="header-actions">
          <button
            className="privacy-toggle"
            onClick={onOpenSettings}
            aria-label="Ajustes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button
            className="privacy-toggle"
            onClick={onOpenHistory}
            aria-label="Ver historial"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </button>
          <button
            className={`privacy-toggle ${isPrivate ? 'active' : ''}`}
            onClick={() => setIsPrivate((prev) => !prev)}
            aria-label="Alternar modo privado"
          >
            {isPrivate ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="grand-total-wrapper">
        <span className="grand-total-label">Patrimonio Neto</span>
        <PrivacyBlur isPrivate={isPrivate}>
          <span className="grand-total-value">
            {centsToDisplay(grandTotalCents, 'BOB')}
          </span>
        </PrivacyBlur>
      </div>

      <div className="rate-widget">
        <span className="rate-label">Tasa P2P</span>
        <input
          type="number"
          step="0.01"
          className="rate-input"
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          onBlur={handleRateBlur}
          inputMode="decimal"
        />
      </div>
    </header>
  );
}