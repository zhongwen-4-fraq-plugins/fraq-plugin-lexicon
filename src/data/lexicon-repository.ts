import type { Lexicon, LexiconEntry, LexiconScopeType, MatchedLexiconEntry, MatchMode } from '../models/lexicon';

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

interface LexiconRow {
  id: number;
  name: string;
  scope_type: LexiconScopeType;
  scope_id: number;
  created_by: number;
  created_at: number;
}

interface EntryRow {
  id: number;
  lexicon_id: number;
  match_mode: MatchMode;
  question: string;
  answer: string;
  created_by: number;
  created_at: number;
}

interface MatchedEntryRow extends EntryRow {
  lexicon_name: string;
  scope_type: LexiconScopeType;
  scope_id: number;
}

export class LexiconRepository {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec('PRAGMA foreign_keys = ON');
    this.database.exec('PRAGMA journal_mode = WAL');
    this.createTables();
  }

  close(): void {
    this.database.close();
  }

  createLexicon(name: string, scopeType: LexiconScopeType, scopeId: number, createdBy: number): Lexicon {
    const result = this.database
      .prepare(`
        INSERT INTO lexicons (name, scope_type, scope_id, created_by, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(name, scopeType, scopeId, createdBy, Date.now());

    return this.getLexiconById(Number(result.lastInsertRowid)) as Lexicon;
  }

  getLexiconById(id: number): Lexicon | undefined {
    const row = this.database.prepare('SELECT * FROM lexicons WHERE id = ?').get(id) as LexiconRow | undefined;
    return row ? mapLexicon(row) : undefined;
  }

  findLexicon(name: string, scopeType: LexiconScopeType, scopeId: number): Lexicon | undefined {
    const row = this.database
      .prepare('SELECT * FROM lexicons WHERE name = ? AND scope_type = ? AND scope_id = ?')
      .get(name, scopeType, scopeId) as LexiconRow | undefined;
    return row ? mapLexicon(row) : undefined;
  }

  deleteLexicon(id: number): boolean {
    return this.database.prepare('DELETE FROM lexicons WHERE id = ?').run(id).changes > 0;
  }

  listGroupLexicons(groupId: number): Lexicon[] {
    const rows = this.database
      .prepare("SELECT * FROM lexicons WHERE scope_type = 'group' AND scope_id = ? ORDER BY name, id")
      .all(groupId) as unknown as LexiconRow[];
    return rows.map(mapLexicon);
  }

  listGlobalLexicons(): Lexicon[] {
    const rows = this.database
      .prepare("SELECT * FROM lexicons WHERE scope_type = 'global' ORDER BY name, id")
      .all() as unknown as LexiconRow[];
    return rows.map(mapLexicon);
  }

  listEnabledGlobalLexicons(groupId: number): Lexicon[] {
    const rows = this.database
      .prepare(`
        SELECT lexicons.*
        FROM lexicons
        INNER JOIN enabled_global_lexicons
          ON enabled_global_lexicons.lexicon_id = lexicons.id
        WHERE lexicons.scope_type = 'global'
          AND enabled_global_lexicons.group_id = ?
        ORDER BY lexicons.name, lexicons.id
      `)
      .all(groupId) as unknown as LexiconRow[];
    return rows.map(mapLexicon);
  }

  isGlobalLexiconEnabled(groupId: number, lexiconId: number): boolean {
    const row = this.database
      .prepare('SELECT 1 AS enabled FROM enabled_global_lexicons WHERE group_id = ? AND lexicon_id = ?')
      .get(groupId, lexiconId) as { enabled: number } | undefined;
    return row !== undefined;
  }

  setGlobalLexiconEnabled(groupId: number, lexiconId: number, enabledBy: number, enabled: boolean): boolean {
    if (enabled) {
      const result = this.database
        .prepare(`
          INSERT OR IGNORE INTO enabled_global_lexicons (group_id, lexicon_id, enabled_by, created_at)
          VALUES (?, ?, ?, ?)
        `)
        .run(groupId, lexiconId, enabledBy, Date.now());
      return result.changes > 0;
    }

    return (
      this.database
        .prepare('DELETE FROM enabled_global_lexicons WHERE group_id = ? AND lexicon_id = ?')
        .run(groupId, lexiconId).changes > 0
    );
  }

  addEntry(lexiconId: number, matchMode: MatchMode, question: string, answer: string, createdBy: number): LexiconEntry {
    const result = this.database
      .prepare(`
        INSERT INTO entries (lexicon_id, match_mode, question, answer, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(lexiconId, matchMode, question, answer, createdBy, Date.now());

    return this.getEntryById(Number(result.lastInsertRowid)) as LexiconEntry;
  }

  getEntryById(id: number): LexiconEntry | undefined {
    const row = this.database.prepare('SELECT * FROM entries WHERE id = ?').get(id) as EntryRow | undefined;
    return row ? mapEntry(row) : undefined;
  }

  deleteEntryById(lexiconId: number, entryId: number): boolean {
    return (
      this.database.prepare('DELETE FROM entries WHERE lexicon_id = ? AND id = ?').run(lexiconId, entryId).changes > 0
    );
  }

  deleteEntriesByQuestion(lexiconId: number, question: string): number {
    return Number(
      this.database.prepare('DELETE FROM entries WHERE lexicon_id = ? AND question = ?').run(lexiconId, question)
        .changes,
    );
  }

  findMatchingEntries(lexiconIds: number[], text: string): MatchedLexiconEntry[] {
    if (lexiconIds.length === 0) {
      return [];
    }

    const placeholders = lexiconIds.map(() => '?').join(', ');
    const rows = this.database
      .prepare(`
        SELECT
          entries.*,
          lexicons.name AS lexicon_name,
          lexicons.scope_type,
          lexicons.scope_id
        FROM entries
        INNER JOIN lexicons ON lexicons.id = entries.lexicon_id
        WHERE entries.lexicon_id IN (${placeholders})
          AND (
            (entries.match_mode = 'exact' AND entries.question = ?)
            OR (entries.match_mode = 'fuzzy' AND instr(?, entries.question) > 0)
          )
      `)
      .all(...lexiconIds, text, text) as unknown as MatchedEntryRow[];

    return rows.map(mapMatchedEntry);
  }

  listEntries(lexiconId: number): LexiconEntry[] {
    const rows = this.database
      .prepare('SELECT * FROM entries WHERE lexicon_id = ? ORDER BY id')
      .all(lexiconId) as unknown as EntryRow[];
    return rows.map(mapEntry);
  }

  private createTables(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS lexicons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'group')),
        scope_id INTEGER NOT NULL,
        created_by INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE (scope_type, scope_id, name)
      );

      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lexicon_id INTEGER NOT NULL REFERENCES lexicons(id) ON DELETE CASCADE,
        match_mode TEXT NOT NULL CHECK (match_mode IN ('exact', 'fuzzy')),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE (lexicon_id, match_mode, question)
      );

      CREATE TABLE IF NOT EXISTS enabled_global_lexicons (
        group_id INTEGER NOT NULL,
        lexicon_id INTEGER NOT NULL REFERENCES lexicons(id) ON DELETE CASCADE,
        enabled_by INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (group_id, lexicon_id)
      );

      CREATE INDEX IF NOT EXISTS idx_entries_lexicon ON entries(lexicon_id);
      CREATE INDEX IF NOT EXISTS idx_lexicons_scope ON lexicons(scope_type, scope_id);
    `);
  }
}

function mapLexicon(row: LexiconRow): Lexicon {
  return {
    id: row.id,
    name: row.name,
    scopeType: row.scope_type,
    scopeId: row.scope_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapEntry(row: EntryRow): LexiconEntry {
  return {
    id: row.id,
    lexiconId: row.lexicon_id,
    matchMode: row.match_mode,
    question: row.question,
    answer: row.answer,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapMatchedEntry(row: MatchedEntryRow): MatchedLexiconEntry {
  return {
    ...mapEntry(row),
    lexiconName: row.lexicon_name,
    scopeType: row.scope_type,
    scopeId: row.scope_id,
  };
}
