import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
// Switched to PessoasService unified model
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { PessoasService } from '../pessoas/pessoas.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private pessoas: PessoasService,
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateUserByIdentifier(identifier: { user: string }, password: string) {
    // Login por username (campo user) exato.
    const candidates = await this.prisma.pessoa.findMany({
      where: { user: identifier.user, type: 'USUARIO' },
      take: 2,
    });
    if (candidates.length !== 1) throw new UnauthorizedException('Invalid credentials');
    const user = candidates[0];
    if (!user || user.type !== 'USUARIO') throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash || '');
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  private accessToken(payload: JwtPayload) {
    const accessTtl = process.env.JWT_ACCESS_TTL || '900s';
    return this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
      expiresIn: accessTtl,
    });
  }

  private async issueRefreshToken(userId: number, sessionId: string) {
    const refreshTtlSec = parseInt(process.env.JWT_REFRESH_TTL || '604800', 10); // 7d
    const expiresAt = new Date(Date.now() + refreshTtlSec * 1000);
    const tokenPlain = uuid() + '.' + uuid();
    const tokenHash = await bcrypt.hash(tokenPlain, 10);

    // Gerar um ID único para o refresh token
    const maxId = await this.prisma.refreshToken.aggregate({
      where: { empCod: 1 },
      _max: { id: true },
    });
    const nextId = (maxId._max.id || 0) + 1;

    await this.prisma.refreshToken.create({
      data: { empCod: 1, id: nextId, userId, tokenHash, expiresAt },
    });
    return { token: tokenPlain };
  }

  private async rotateRefreshToken(old: { id: number; revokedAt: Date | null }) {
    if (old.revokedAt) throw new UnauthorizedException('Token revoked');
    await this.prisma.refreshToken.update({
      where: { empCod_id: { empCod: 1, id: old.id } },
      data: { revokedAt: new Date() },
    });
  }

  private async validateRefreshToken(refreshToken: string) {
    const active = await this.prisma.refreshToken.findMany({ where: { revokedAt: null } });
    for (const t of active) {
      const ok = await bcrypt.compare(refreshToken, t.tokenHash);
      if (ok) return t;
    }
    throw new UnauthorizedException('Invalid refresh token');
  }

  async login(identifier: { user: string }, password: string) {
    const user = await this.validateUserByIdentifier(identifier, password);
    const sessionId = uuid();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: [user.role],
      sessionId,
    };
    const accessToken = this.accessToken(payload);
    const { token: refreshToken } = await this.issueRefreshToken(user.id, sessionId);
    const companies = await this.prisma.empresaUser.findMany({
      where: { userId: user.id },
      select: { empCod: true },
    });
    return {
      accessToken,
      refreshToken,
      companies: companies.map((c: { empCod: number }) => c.empCod),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.validateRefreshToken(refreshToken);
    if (stored.expiresAt < new Date()) throw new UnauthorizedException('Expired refresh token');
    const user = await this.prisma.pessoa.findUnique({
      where: { empCod_id: { empCod: 1, id: stored.userId } },
    });
    if (!user) throw new UnauthorizedException();

    const sessionId = uuid();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: [user.role],
      sessionId,
    };
    const accessToken = this.accessToken(payload);

    const rotate = (process.env.JWT_REFRESH_ROTATE ?? 'true') !== 'false';
    if (!rotate) {
      // Keep the same refresh token; extend session via access token only
      return { accessToken, refreshToken };
    }

    await this.rotateRefreshToken(stored);
    const { token: newRefresh } = await this.issueRefreshToken(user.id, sessionId);
    return { accessToken, refreshToken: newRefresh };
  }

  async selectCompany(userId: number, companyId: number) {
    const rel = await this.prisma.empresaUser.findUnique({
      where: { empCod_userId: { empCod: companyId, userId } },
    });
    if (!rel) throw new BadRequestException('User not in company');
    const user = await this.prisma.pessoa.findUnique({
      where: { empCod_id: { empCod: 1, id: userId } },
    });
    if (!user) throw new UnauthorizedException();
    const sessionId = uuid();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: [user.role],
      sessionId,
      activeCompanyId: companyId,
    };
    const accessToken = this.accessToken(payload);
    return { accessToken };
  }
}
