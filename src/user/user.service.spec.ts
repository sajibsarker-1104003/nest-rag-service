import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserService } from './user.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: {} },
        { provide: JwtService, useValue: { sign: () => 'test-token' } },
      ],
    }).compile();

    service = moduleRef.get(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
