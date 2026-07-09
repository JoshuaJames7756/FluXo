/**
 * Verificacion manual de JWT de Clerk para uso en /api con claves sk_test_.
 * NO usar @clerk/backend aqui: sin dominio propio configurado en Clerk,
 * verifyToken() del SDK oficial falla. Decodificamos el payload manualmente
 * y validamos 'sub' (user id) y 'exp' (expiracion).
 *
 * Cuando tengas dominio propio configurado en Clerk:
 * cambiar a sk_live_ / pk_live_ y reemplazar esta funcion por
 * createClerkClient({ secretKey }).verifyToken(token) del SDK oficial.
 */
export function verificarClerk(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Falta el header Authorization Bearer' };
  }

  const token = authHeader.replace('Bearer ', '');
  const parts = token.split('.');

  if (parts.length !== 3) {
    return { valid: false, error: 'Token con formato invalido' };
  }

  try {
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    if (!payload.sub) {
      return { valid: false, error: 'Token sin sub (user id)' };
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowInSeconds) {
      return { valid: false, error: 'Token expirado' };
    }

    return { valid: true, userId: payload.sub };
  } catch (err) {
    return { valid: false, error: 'Error decodificando token: ' + err.message };
  }
}