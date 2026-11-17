#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/a214e7f3659257f6b158170dad1d61e717c5de6c68e658852ddb68dc6bc5e673/contract';
import endContract from '../../snapshots/a214e7f3659257f6b158170dad1d61e717c5de6c68e658852ddb68dc6bc5e673/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/bfc1e32c3271dd6ecec90ca04bca0caefc8783387dbae81b62e483ee1afe8614/contract';
import startContract from '../../snapshots/bfc1e32c3271dd6ecec90ca04bca0caefc8783387dbae81b62e483ee1afe8614/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.alterColumnType({
        schema: 'public',
        table: 'Document',
        column: 'embedding',
        type: 'vector(1024)',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
