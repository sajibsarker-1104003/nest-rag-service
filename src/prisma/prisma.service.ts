import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { usersDb } from './users-db.js';
import { docsDb } from './docs-db.js';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  public readonly users = usersDb;
  public readonly docs = docsDb;

  async onModuleDestroy() {
    await this.users.close();
    await this.docs.close();
  }
}