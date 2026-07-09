import { sql } from '../src/lib/db.js';
import { verificarClerk } from '../src/lib/clerk.js';

export default async function handler(req, res) {
  const authResult = verificarClerk(req.headers.authorization);

  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error });
  }

  const userId = authResult.userId;

  if (req.method === 'GET') {
    return handleGet(req, res, userId);
  }

  if (req.method === 'POST') {
    return handlePost(req, res, userId);
  }

  return res.status(405).json({ error: 'Metodo no permitido' });
}

async function handleGet(req, res, userId) {
  try {
    let pockets = await sql`
      SELECT * FROM pockets WHERE user_id = ${userId} ORDER BY id ASC
    `;

    // Si el usuario es nuevo, sembramos sus 5 bolsillos iniciales
    if (pockets.length === 0) {
      const seedPockets = [
        { name: 'Binance', currency: 'USD', color_key: 'binance' },
        { name: 'BNB', currency: 'BOB', color_key: 'bank' },
        { name: 'BCP', currency: 'BOB', color_key: 'bank' },
        { name: 'Ganadero', currency: 'BOB', color_key: 'bank' },
        { name: 'Efectivo', currency: 'BOB', color_key: 'cash' },
      ];

      for (const p of seedPockets) {
        await sql`
          INSERT INTO pockets (user_id, name, currency, balance_cents, color_key)
          VALUES (${userId}, ${p.name}, ${p.currency}, 0, ${p.color_key})
        `;
      }

      pockets = await sql`
        SELECT * FROM pockets WHERE user_id = ${userId} ORDER BY id ASC
      `;
    }

    let categories = await sql`
      SELECT * FROM categories WHERE user_id = ${userId} ORDER BY id ASC
    `;

    if (categories.length === 0) {
      const seedCategories = [
        { name: 'Transporte', icon: '🚌' },
        { name: 'Almuerzo', icon: '🍽️' },
        { name: 'Gastos Hormiga', icon: '🐜' },
        { name: 'Salidas', icon: '🎉' },
      ];

      for (const c of seedCategories) {
        await sql`
          INSERT INTO categories (user_id, name, icon)
          VALUES (${userId}, ${c.name}, ${c.icon})
        `;
      }

      categories = await sql`
        SELECT * FROM categories WHERE user_id = ${userId} ORDER BY id ASC
      `;
    }

    const transactions = await sql`
      SELECT * FROM transactions
      WHERE user_id = ${userId}
      ORDER BY client_created_at DESC
      LIMIT 200
    `;

    // IMPORTANTE: @neondatabase/serverless devuelve columnas BIGINT como
    // string en JS (para no perder precision), no como number. Si no se
    // convierten aqui, sumas como "total + balance_cents" en el frontend
    // terminan concatenando texto en vez de sumar numeros.
    const normalizedPockets = pockets.map((p) => ({
      ...p,
      balance_cents: Number(p.balance_cents),
    }));

    const normalizedTransactions = transactions.map((t) => ({
      ...t,
      amount_cents: Number(t.amount_cents),
      exchange_rate_snapshot: t.exchange_rate_snapshot !== null
        ? Number(t.exchange_rate_snapshot)
        : null,
    }));

    return res.status(200).json({
      pockets: normalizedPockets,
      categories,
      transactions: normalizedTransactions,
    });
  } catch (err) {
    console.error('Error en GET /api/data:', err);
    return res.status(500).json({ error: 'Error al obtener los datos' });
  }
}

async function handlePost(req, res, userId) {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Se esperaba un array de transactions' });
    }

    const results = [];

    for (const tx of transactions) {
      // Last-write-wins: si local_id ya existe, comparamos client_created_at
      // y solo actualizamos si la version entrante es mas reciente
      const existing = await sql`
        SELECT local_id, client_created_at FROM transactions
        WHERE local_id = ${tx.local_id} AND user_id = ${userId}
      `;

      if (existing.length > 0) {
        const existingTime = new Date(existing[0].client_created_at).getTime();
        const incomingTime = new Date(tx.client_created_at).getTime();

        if (incomingTime <= existingTime) {
          results.push({ local_id: tx.local_id, status: 'skipped_older' });
          continue;
        }
      }

      await sql`
        INSERT INTO transactions (
          local_id, user_id, type, amount_cents, source_pocket_id,
          destination_pocket_id, category_id, exchange_rate_snapshot,
          note, receipt_url, client_created_at, synced
        ) VALUES (
          ${tx.local_id}, ${userId}, ${tx.type}, ${tx.amount_cents},
          ${tx.source_pocket_id}, ${tx.destination_pocket_id || null},
          ${tx.category_id || null}, ${tx.exchange_rate_snapshot || null},
          ${tx.note || ''}, ${tx.receipt_url || null},
          ${tx.client_created_at}, true
        )
        ON CONFLICT (local_id) DO UPDATE SET
          amount_cents = EXCLUDED.amount_cents,
          note = EXCLUDED.note,
          synced = true
      `;

      // Aplicamos el impacto en balances de pockets
      if (tx.source_pocket_id) {
        await sql`
          UPDATE pockets SET balance_cents = balance_cents + ${tx.amount_cents}
          WHERE id = ${tx.source_pocket_id} AND user_id = ${userId}
        `;
      }

      if (tx.destination_pocket_id && tx.type !== 'expense') {
        const destAmount = tx.type === 'p2p_change' || tx.type === 'internal_transfer'
          ? Math.abs(tx.amount_cents)
          : 0;
        if (destAmount > 0) {
          await sql`
            UPDATE pockets SET balance_cents = balance_cents + ${destAmount}
            WHERE id = ${tx.destination_pocket_id} AND user_id = ${userId}
          `;
        }
      }

      results.push({ local_id: tx.local_id, status: 'synced' });
    }

    const updatedPockets = await sql`
      SELECT * FROM pockets WHERE user_id = ${userId} ORDER BY id ASC
    `;

    const normalizedUpdatedPockets = updatedPockets.map((p) => ({
      ...p,
      balance_cents: Number(p.balance_cents),
    }));

    return res.status(200).json({ results, pockets: normalizedUpdatedPockets });
  } catch (err) {
    console.error('Error en POST /api/data:', err);
    return res.status(500).json({ error: 'Error al sincronizar transacciones' });
  }
}