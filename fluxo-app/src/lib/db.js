import { neon } from '@neondatabase/serverless';

/**
 * Cliente de Neon. Este archivo SOLO se importa desde /api,
 * nunca desde el frontend (DATABASE_URL no debe exponerse al cliente).
 */
export const sql = neon(process.env.DATABASE_URL);