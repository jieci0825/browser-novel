import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export class CacheService {
    private db: DatabaseSync
    private stmtGet: ReturnType<DatabaseSync['prepare']>
    private stmtSet: ReturnType<DatabaseSync['prepare']>
    private stmtDel: ReturnType<DatabaseSync['prepare']>

    constructor(dbPath: string) {
        mkdirSync(dirname(dbPath), { recursive: true })
        this.db = new DatabaseSync(dbPath)
        this.initTable()
        this.stmtGet = this.db.prepare(
            'SELECT value FROM cache WHERE key = ?'
        )
        this.stmtSet = this.db.prepare(
            'INSERT OR REPLACE INTO cache (key, value, updated_at) VALUES (?, ?, ?)'
        )
        this.stmtDel = this.db.prepare('DELETE FROM cache WHERE key = ?')
    }

    private initTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS cache (
                key        TEXT PRIMARY KEY,
                value      TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            )
        `)
    }

    get<T>(key: string): T | null {
        const row = this.stmtGet.get(key) as { value: string } | undefined
        if (!row) return null
        return JSON.parse(row.value) as T
    }

    set(key: string, value: unknown): void {
        this.stmtSet.run(key, JSON.stringify(value), Date.now())
    }

    delete(key: string): void {
        this.stmtDel.run(key)
    }

    close(): void {
        this.db.close()
    }
}

const DATA_DIR = process.env.DATA_DIR ?? './data'
export const cacheService = new CacheService(`${DATA_DIR}/cache.db`)
