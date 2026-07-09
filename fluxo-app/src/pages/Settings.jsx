import { useState } from 'react';
import { centsToDisplay, displayToCents } from '../lib/money';
import './Settings.css';

export default function Settings({ pockets, registerCashAdjustment, onBack }) {
  const [selectedPocketId, setSelectedPocketId] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [feedback, setFeedback] = useState('');

  const selectedPocket = pockets.find((p) => p.id === Number(selectedPocketId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPocketId || newBalance === '') return;

    const newBalanceCents = displayToCents(newBalance);
    const previousCents = selectedPocket.balance_cents;
    const differenceCents = newBalanceCents - previousCents;

    await registerCashAdjustment({
      pocketId: Number(selectedPocketId),
      newBalanceCents,
    });

    const differenceLabel = differenceCents >= 0
      ? `+${centsToDisplay(differenceCents, selectedPocket.currency)}`
      : `-${centsToDisplay(Math.abs(differenceCents), selectedPocket.currency)}`;

    setFeedback(`Ajuste aplicado. Diferencia registrada: ${differenceLabel}`);
    setNewBalance('');
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="app-screen settings-screen">
      <header className="history-header">
        <button className="back-btn" onClick={onBack} aria-label="Volver">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <span className="history-title">Ajustes</span>
        <span style={{ width: 30 }} />
      </header>

      <div className="scroll-container settings-container">
        <section className="settings-section">
          <h2 className="settings-section-title">Ajuste de Caja Rápido</h2>
          <p className="settings-section-desc">
            Usa esto si el saldo real en físico/cuenta no coincide con lo que muestra FluXo.
            La diferencia se calculará y guardará como un ajuste automático en tu historial.
          </p>

          <form className="settings-form" onSubmit={handleSubmit}>
            <label className="form-label">
              Bolsillo a ajustar
              <select
                className="form-select"
                value={selectedPocketId}
                onChange={(e) => setSelectedPocketId(e.target.value)}
                required
              >
                <option value="">Selecciona un bolsillo</option>
                {pockets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            {selectedPocket && (
              <div className="current-balance-hint">
                <span>Saldo actual en app:</span>
                <strong>{centsToDisplay(selectedPocket.balance_cents, selectedPocket.currency)}</strong>
              </div>
            )}

            <label className="form-label">
              Saldo real contado
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                className="form-input"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <button type="submit" className="modal-submit-btn primary-btn">
              Aplicar ajuste de caja
            </button>

            {feedback && (
              <div className="settings-feedback-card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>{feedback}</span>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}