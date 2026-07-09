/**
 * Todo el dinero se guarda y calcula internamente en CENTAVOS (integer),
 * nunca en decimales flotantes, para evitar errores de redondeo.
 */

// Convierte centavos a un string formateado para mostrar (ej. 150050 -> "1,500.50")
export function centsToDisplay(cents, currency = 'BOB') {
  const value = cents / 100;
  const formatted = value.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === 'USD' ? '$' : 'Bs';
  return `${symbol} ${formatted}`;
}

// Convierte un input de usuario (ej. "150.5") a centavos enteros
export function displayToCents(value) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

// Convierte un monto en USD (centavos) a BOB (centavos) usando la tasa del dia
export function usdCentsToBobCents(usdCents, rate) {
  return Math.round(usdCents * rate);
}

// Calcula el Gran Total General: suma de bolsillos BOB + (Binance USD * tasa)
export function calculateGrandTotal(pockets, exchangeRate) {
  return pockets.reduce((total, pocket) => {
    if (pocket.currency === 'USD') {
      return total + usdCentsToBobCents(pocket.balance_cents, exchangeRate);
    }
    return total + pocket.balance_cents;
  }, 0);
}