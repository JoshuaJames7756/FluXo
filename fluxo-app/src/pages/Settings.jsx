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
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div className="app-screen">
      <header className="history-header">
        <button className="back-btn" onClick={onBack} aria-label="Volver">←</button>
        <span className="history-title">Ajustes</span>
        <span style={{ width: 36 }} />
      </header>

      <div className="scroll-container">
        <section className="settings-section">
          <h2 className="settings-section-title">Ajuste de Caja Rápido</h2>
          <p className="settings-section-desc">
            Usa esto si el saldo real en la calle no coincide con lo que muestra FluXo.
            La diferencia se registra automáticamente como ajuste en el historial.
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
              <p className="current-balance-hint">
                Saldo actual en FluXo: {centsToDisplay(selectedPocket.balance_cents, selectedPocket.currency)}
              </p>
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
              Aplicar ajuste
            </button>

            {feedback && <p className="settings-feedback">{feedback}</p>}
          </form>
        </section>
      </div>
    </div>
  );
}