import { useState, useEffect } from 'react';

const STORAGE_KEY = 'fluxo_exchange_rate';
const DEFAULT_RATE = 11.20;

/**
 * Maneja la tasa de cambio del dia. Persiste en localStorage
 * para que no se pierda al recargar la PWA (esto NO es dato financiero
 * sensible ni transaccional, solo una preferencia de sesion, por eso
 * usamos localStorage y no IndexedDB aqui).
 */
export function useExchangeRate() {
  const [rate, setRate] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseFloat(saved) : DEFAULT_RATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, rate.toString());
  }, [rate]);

  const updateRate = (newRate) => {
    const parsed = parseFloat(newRate);
    if (!isNaN(parsed) && parsed > 0) {
      setRate(parsed);
    }
  };

  return { rate, updateRate };
}