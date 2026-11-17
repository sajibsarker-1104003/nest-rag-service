import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UserService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtService) private jwt: JwtService,
  ) {}

  private stripPassword(user: any) {
    if (!user) return user;
    const { password, ...safe } = user;
    return safe;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.users.orm.public.User
      .where({ email: dto.email })
      .first();

    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.users.orm.public.User
      .create({ email: dto.email, password: hashed, name: dto.name ?? null });

    return this.stripPassword(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.orm.public.User
      .where({ email: dto.email })
      .first();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async create(dto: RegisterDto) {
    return this.register(dto);
  }

  async findAll() {
    const users = await this.prisma.users.orm.public.User.all();
    return users.map((u) => this.stripPassword(u));
  }

  async findOne(id: number) {
    const user = await this.prisma.users.orm.public.User
      .where({ id })
      .first();

    if (!user) throw new NotFoundException('User not found');
    return this.stripPassword(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const existing = await this.prisma.users.orm.public.User
      .where({ id })
      .first();

    if (!existing) throw new NotFoundException('User not found');

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) {
      const conflict = await this.prisma.users.orm.public.User
        .where({ email: dto.email })
        .first();
      if (conflict && conflict.id !== id) {
        throw new ConflictException('Email already in use');
      }
      data.email = dto.email;
    }
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.users.orm.public.User
      .where({ id })
      .update(data);

    return this.stripPassword(user);
  }

  async remove(id: number) {
    const existing = await this.prisma.users.orm.public.User
      .where({ id })
      .first();

    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.users.orm.public.User
      .where({ id })
      .delete();

    return { deleted: true, id };
  }
}