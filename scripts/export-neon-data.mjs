import fs from "node:fs/promises"
import pg from "pg"

const { Client } = pg
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is required")

const client = new Client({ connectionString })
await client.connect()
try {
  const tablesResult = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> '_prisma_migrations'
    ORDER BY table_name
  `)
  const lines = [
    "-- Centralia Neon data export",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Restore after neon-schema-and-seed.sql has been applied.",
    "-- This contains current public application data, including password hashes and session tokens.",
    "",
    "BEGIN;",
    "SET CONSTRAINTS ALL DEFERRED;",
    "",
  ]

  const quote = (value) => {
    if (value === null || value === undefined) return "NULL"
    if (value instanceof Date) return `'${value.toISOString().replaceAll("'", "''")}'`
    if (Buffer.isBuffer(value)) return `'\\x${value.toString("hex")}'::bytea`
    if (typeof value === "object") return `'${JSON.stringify(value).replaceAll("'", "''")}'`
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE"
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL"
    return `'${String(value).replaceAll("'", "''")}'`
  }

  for (const { table_name: table } of tablesResult.rows) {
    const columnsResult = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
      [table],
    )
    const columns = columnsResult.rows.map((row) => row.column_name)
    const rows = await client.query(`SELECT * FROM public."${table.replaceAll('"', '""')}"`)
    if (!rows.rows.length) continue
    const columnSql = columns.map((column) => `"${column.replaceAll('"', '""')}"`).join(", ")
    for (const row of rows.rows) {
      const values = columns.map((column) => quote(row[column])).join(", ")
      lines.push(`INSERT INTO public."${table.replaceAll('"', '""')}" (${columnSql}) VALUES (${values});`)
    }
    lines.push("")
  }

  lines.push("COMMIT;", "")
  await fs.writeFile("backups/neon-data.sql", lines.join("\n"), "utf8")
  console.log(`Exported ${tablesResult.rows.length} public tables to backups/neon-data.sql`)
} finally {
  await client.end()
}
