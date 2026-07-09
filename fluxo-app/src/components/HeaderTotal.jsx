import { useState } from 'react';
import PrivacyBlur from './PrivacyBlur';
import { centsToDisplay, calculateGrandTotal } from '../lib/money';
import './HeaderTotal.css';

export default function HeaderTotal({ pockets, exchangeRate, onRateChange, onOpenHistory, onOpenSettings, isOnline, isSyncing }) {
  const [isPrivate, setIsPrivate] = useState(false);
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
            ⚙️
          </button>
          <button
            className="privacy-toggle"
            onClick={onOpenHistory}
            aria-label="Ver historial"
          >
            📋
          </button>
          <button
            className="privacy-toggle"
            onClick={() => setIsPrivate((prev) => !prev)}
            aria-label="Alternar modo privado"
          >
            {isPrivate ? '🙈' : '👁️'}
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