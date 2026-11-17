import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './prisma/users/contract.prisma',
    migrations: { dir: './prisma/users/migrations' },
    db: {
    },
  }),
  skills: { check: false },
});
