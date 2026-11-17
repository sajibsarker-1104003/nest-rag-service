import pgvector from '@prisma/orm-extension-pgvector/runtime';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from '../../prisma/docs/contract.js';
import contractJson from '../../prisma/docs/contract.json' with { type: 'json' };

const contract = contractFromJson<Contract>(contractJson);

export const docsDb = postgres({
  contract,
  url: process.env.DOCS_DATABASE_URL!,
  extensions: [pgvector],
});