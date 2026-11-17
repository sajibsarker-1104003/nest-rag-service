#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c257feb8b22fa8b94fbfa00070124b19d30488ddbcf114c799b907e9ed24685e/contract';
import endContract from '../../snapshots/c257feb8b22fa8b94fbfa00070124b19d30488ddbcf114c799b907e9ed24685e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f997ca7a09b4f999017db01b44042da81b3580be70c593acc201de0b5d38df7b/contract';
import startContract from '../../snapshots/f997ca7a09b4f999017db01b44042da81b3580be70c593acc201de0b5d38df7b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'User',
        column: 'updatedAt',
        type: 'timestamptz(3)',
        temporaryDefault: sql`'epoch'`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
