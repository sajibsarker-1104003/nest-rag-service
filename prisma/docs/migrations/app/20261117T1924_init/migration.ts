#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/bfc1e32c3271dd6ecec90ca04bca0caefc8783387dbae81b62e483ee1afe8614/contract';
import endContract from '../../snapshots/bfc1e32c3271dd6ecec90ca04bca0caefc8783387dbae81b62e483ee1afe8614/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Document',
        columns: [
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('embedding', 'vector(1536)', {
            codecRef: { codecId: 'pg/vector@1', typeParams: { length: 1536 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
