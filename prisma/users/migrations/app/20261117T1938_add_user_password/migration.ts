#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/50da57ce260a6293f822d04abc315dcead97d9bc13ba7f5c53a87819fca2f912/contract';
import startContract from '../../snapshots/50da57ce260a6293f822d04abc315dcead97d9bc13ba7f5c53a87819fca2f912/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f997ca7a09b4f999017db01b44042da81b3580be70c593acc201de0b5d38df7b/contract';
import endContract from '../../snapshots/f997ca7a09b4f999017db01b44042da81b3580be70c593acc201de0b5d38df7b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'User',
        column: 'password',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
