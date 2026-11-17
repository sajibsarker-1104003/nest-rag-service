import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from '../../prisma/users/contract.js';
import contractJson from '../../prisma/users/contract.json' with { type: 'json' };

const contract = contractFromJson<Contract>(contractJson);

export const usersDb = postgres({
  contract,
  url: process.env.USERS_DATABASE_URL!,  // Pass url here
});