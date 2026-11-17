import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: {} }],
    }).compile();

    controller = moduleRef.get(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
