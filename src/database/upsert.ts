import { EntityManager } from "typeorm";

export interface Counts {
  created: number;
  updated: number;
  unchanged: number;
}

/** pg sends JS arrays as Postgres arrays; jsonb columns need JSON text. */
export const param = (value: unknown) =>
  typeof value === "object" && value !== null && !(value instanceof Date)
    ? JSON.stringify(value)
    : value;

const pad = (n: number) => String(n).padStart(2, "0");

/** pg returns date columns as local-midnight Dates and times as HH:MM:SS; compare like with like. */
function sameValue(stored: unknown, wanted: unknown): boolean {
  if (stored instanceof Date) {
    if (wanted instanceof Date) return stored.getTime() === wanted.getTime();
    if (typeof wanted === "string" && /^\d{4}-\d{2}-\d{2}$/.test(wanted)) {
      return (
        `${stored.getFullYear()}-${pad(stored.getMonth() + 1)}-${pad(stored.getDate())}` ===
        wanted
      );
    }
  }
  if (typeof stored === "string" && typeof wanted === "string") {
    if (/^\d{2}:\d{2}$/.test(wanted)) return stored === `${wanted}:00`;
  }
  return JSON.stringify(stored) === JSON.stringify(wanted);
}

/**
 * Finds the row matching `where`; inserts it with `values` if missing, otherwise updates only
 * the columns in `values` that differ. Returns the row id. Used by the idempotent seed scripts.
 */
export async function upsert(
  manager: EntityManager,
  table: string,
  where: Record<string, unknown>,
  values: Record<string, unknown>,
  tally?: Counts,
): Promise<number> {
  const keys = Object.keys(where);
  const conditions = keys.map((key, i) => `"${key}" = $${i + 1}`).join(" AND ");
  const rows: Record<string, unknown>[] = await manager.query(
    `SELECT * FROM "${table}" WHERE ${conditions} ORDER BY id LIMIT 1`,
    keys.map((key) => where[key]),
  );
  if (!rows.length) {
    const all = { ...where, ...values };
    const columns = Object.keys(all);
    const [{ id }] = await manager.query(
      `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`,
      columns.map((c) => param(all[c])),
    );
    if (tally) tally.created++;
    return id;
  }
  const row = rows[0];
  const changed = Object.keys(values).filter(
    (key) => !sameValue(row[key], values[key]),
  );
  if (changed.length) {
    await manager.query(
      `UPDATE "${table}" SET ${changed.map((c, i) => `"${c}" = $${i + 1}`).join(", ")} WHERE id = $${changed.length + 1}`,
      [...changed.map((c) => param(values[c])), row.id],
    );
    if (tally) tally.updated++;
  } else if (tally) {
    tally.unchanged++;
  }
  return row.id as number;
}
