/**
 * Todo el dinero se guarda y calcula internamente en CENTAVOS (integer),
 * nunca en decimales flotantes, para evitar errores de redondeo de punto flotante.
 */

/**
 * Convierte centavos a un string formateado para mostrar de forma consistente.
 * Ejemplos: 
 * 150050, 'BOB'  -> "Bs 1.500,50"
 * -50000, 'USD'  -> "-$ 500,00"
 */
export function centsToDisplay(cents, currency = 'BOB') {
  const isNegative = cents < 0;
  const absoluteValue = Math.abs(cents) / 100;

  // Forzamos formato estándar boliviano: punto para miles, coma para decimales
  const formatted = absoluteValue.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = currency === 'USD' ? '$' : 'Bs';
  
  // Si es negativo, colocamos el signo menos antes del símbolo de la moneda
  return isNegative ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
}

/**
 * Convierte un input numérico o string del usuario (ej. "150,50" o "150.5") a centavos enteros.
 */
export function displayToCents(value) {
  if (value === undefined || value === null) return 0;
  
  // Si viene como número, lo pasamos a string para normalizar comas por puntos
  let stringValue = String(value).trim();
  
  // Reemplaza comas de teclados móviles por puntos para asegurar un parseFloat limpio
  stringValue = stringValue.replace(',', '.');

  const parsed = parseFloat(stringValue);
  if (isNaN(parsed) || !isFinite(parsed)) return 0;

  // Math.round previene cualquier micro-residuo decimal flotante antes de truncar a entero
  return Math.round(parsed * 100);
}

/**
 * Convierte un monto en USD (centavos) a BOB (centavos) usando la tasa congelada del día.
 */
export function usdCentsToBobCents(usdCents, rate) {
  const cleanUsd = Number(usdCents) || 0;
  const cleanRate = Number(rate) || 0;
  return Math.round(cleanUsd * cleanRate);
}

/**
 * Calcula el Gran Total General: suma de bolsillos BOB + (Binance USD * tasa)
 */
export function calculateGrandTotal(pockets, exchangeRate) {
  if (!Array.isArray(pockets)) return 0;
  const cleanRate = Number(exchangeRate) || 0;

  return pockets.reduce((total, pocket) => {
    // Number(...) como blindaje contra tipos BIGINT de la base de datos de Supabase/Neon
    const balanceCents = Number(pocket.balance_cents) || 0;

    if (pocket.currency === 'USD') {
      return total + usdCentsToBobCents(balanceCents, cleanRate);
    }
    return total + balanceCents;
  }, 0);
}