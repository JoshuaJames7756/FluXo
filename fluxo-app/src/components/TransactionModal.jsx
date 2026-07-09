import { useState } from 'react';
import { displayToCents } from '../lib/money';
import { uploadReceipt, compressImage } from '../lib/cloudinary';
import './TransactionModal.css';

const TABS = [
  { key: 'expense', label: 'Gasto' },
  { key: 'p2p_change', label: 'Cambio P2P' },
  { key: 'internal_transfer', label: 'Traspaso' },
];

export default function TransactionModal({
  isOpen,
  onClose,
  pockets,
  categories,
  onRegisterExpense,
  onRegisterP2PChange,
  onRegisterInternalTransfer,
}) {
  const [activeTab, setActiveTab] = useState('expense');

  // Estado del formulario de Gasto
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSourceId, setExpenseSourceId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  // Estado del formulario de Cambio P2P
  const [p2pUsdAmount, setP2pUsdAmount] = useState('');
  const [p2pRate, setP2pRate] = useState('');
  const [p2pDestinationId, setP2pDestinationId] = useState('');

  // Estado del formulario de Traspaso Interno
  const [transferAmount, setTransferAmount] = useState('');
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferDestinationId, setTransferDestinationId] = useState('');

  if (!isOpen) return null;

  const resetAndClose = () => {
    setExpenseAmount('');
    setExpenseSourceId('');
    setExpenseCategoryId('');
    setExpenseNote('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setP2pUsdAmount('');
    setP2pRate('');
    setP2pDestinationId('');
    setTransferAmount('');
    setTransferSourceId('');
    setTransferDestinationId('');
    onClose();
  };

  const handleReceiptSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount || !expenseSourceId) return;

    let receiptUrl = null;

    if (receiptFile) {
      setIsUploadingReceipt(true);
      try {
        const compressed = await compressImage(receiptFile);
        receiptUrl = await uploadReceipt(compressed);
      } catch (err) {
        console.error('Error subiendo recibo, se registra el gasto sin foto:', err);
        // No bloqueamos el registro del gasto si falla la subida de la foto,
        // la plata sigue siendo lo prioritario en la calle
      } finally {
        setIsUploadingReceipt(false);
      }
    }

    await onRegisterExpense({
      amountCents: displayToCents(expenseAmount),
      sourcePocketId: Number(expenseSourceId),
      categoryId: expenseCategoryId ? Number(expenseCategoryId) : null,
      note: expenseNote,
      receiptUrl,
    });
    resetAndClose();
  };

  const handleSubmitP2P = async (e) => {
    e.preventDefault();
    if (!p2pUsdAmount || !p2pRate || !p2pDestinationId) return;

    await onRegisterP2PChange({
      usdAmountCents: displayToCents(p2pUsdAmount),
      agreedRate: parseFloat(p2pRate),
      destinationPocketId: Number(p2pDestinationId),
    });
    resetAndClose();
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (!transferAmount || !transferSourceId || !transferDestinationId) return;
    if (transferSourceId === transferDestinationId) return;

    await onRegisterInternalTransfer({
      amountCents: displayToCents(transferAmount),
      sourcePocketId: Number(transferSourceId),
      destinationPocketId: Number(transferDestinationId),
    });
    resetAndClose();
  };

  const bobPockets = pockets.filter((p) => p.currency === 'BOB');

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="modal-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`modal-tab ${activeTab === tab.key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'expense' && (
          <form className="modal-form" onSubmit={handleSubmitExpense}>
            <label className="form-label">
              Monto (Bs)
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                className="form-input"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <label className="form-label">
              Pagado con
              <select
                className="form-select"
                value={expenseSourceId}
                onChange={(e) => setExpenseSourceId(e.target.value)}
                required
              >
                <option value="">Selecciona cuenta</option>
                {pockets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Categoría
              <select
                className="form-select"
                value={expenseCategoryId}
                onChange={(e) => setExpenseCategoryId(e.target.value)}
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Nota (opcional)
              <input
                type="text"
                className="form-input"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                placeholder="Ej. Almuerzo con cliente"
              />
            </label>

            <label className="form-label">
              Recibo (opcional)
              {!receiptPreview && (
                <label className="receipt-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleReceiptSelect}
                    style={{ display: 'none' }}
                  />
                  📷 Adjuntar foto del recibo
                </label>
              )}
              {receiptPreview && (
                <div className="receipt-preview-wrapper">
                  <img src={receiptPreview} alt="Preview del recibo" className="receipt-preview" />
                  <button type="button" className="receipt-remove-btn" onClick={handleRemoveReceipt}>
                    Quitar
                  </button>
                </div>
              )}
            </label>

            <button type="submit" className="modal-submit-btn expense-btn" disabled={isUploadingReceipt}>
              {isUploadingReceipt ? 'Subiendo recibo...' : 'Registrar gasto'}
            </button>
          </form>
        )}

        {activeTab === 'p2p_change' && (
          <form className="modal-form" onSubmit={handleSubmitP2P}>
            <label className="form-label">
              Monto vendido (USD)
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                className="form-input"
                value={p2pUsdAmount}
                onChange={(e) => setP2pUsdAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <label className="form-label">
              Tasa acordada
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                className="form-input"
                value={p2pRate}
                onChange={(e) => setP2pRate(e.target.value)}
                placeholder="Ej. 11.50"
                required
              />
            </label>

            <label className="form-label">
              Cuenta destino
              <select
                className="form-select"
                value={p2pDestinationId}
                onChange={(e) => setP2pDestinationId(e.target.value)}
                required
              >
                <option value="">Selecciona cuenta BOB</option>
                {bobPockets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            {p2pUsdAmount && p2pRate && (
              <p className="form-preview">
                Recibirás aprox. Bs {(parseFloat(p2pUsdAmount) * parseFloat(p2pRate)).toFixed(2)}
              </p>
            )}

            <button type="submit" className="modal-submit-btn binance-btn">
              Confirmar cambio
            </button>
          </form>
        )}

        {activeTab === 'internal_transfer' && (
          <form className="modal-form" onSubmit={handleSubmitTransfer}>
            <label className="form-label">
              Monto (Bs)
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                className="form-input"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <label className="form-label">
              Desde
              <select
                className="form-select"
                value={transferSourceId}
                onChange={(e) => setTransferSourceId(e.target.value)}
                required
              >
                <option value="">Selecciona cuenta origen</option>
                {bobPockets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Hacia
              <select
                className="form-select"
                value={transferDestinationId}
                onChange={(e) => setTransferDestinationId(e.target.value)}
                required
              >
                <option value="">Selecciona cuenta destino</option>
                {bobPockets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <button type="submit" className="modal-submit-btn primary-btn">
              Registrar traspaso
            </button>
          </form>
        )}
      </div>
    </div>
  );
}