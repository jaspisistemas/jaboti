import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class AtendimentosGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(AtendimentosGateway.name);
  private socketToUser = new Map<string, number>();
  private userToSockets = new Map<number, Set<string>>();

  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) return this.kick(client, 'Missing token');
      const payload = await this.verifyToken(token);
      const userId = payload?.sub;
      if (!userId) return this.kick(client, 'Invalid token payload');

      this.socketToUser.set(client.id, userId);
      const set = this.userToSockets.get(userId) || new Set<string>();
      set.add(client.id);
      this.userToSockets.set(userId, set);

      client.join(`user:${userId}`);
      if ((payload as any)?.activeCompanyId) client.join(`company:${(payload as any).activeCompanyId}`);

      await this.prisma.pessoa.update({ where: { id: userId }, data: { online: true } }).catch(() => undefined);
      this.logger.debug(`User ${userId} connected (socket ${client.id})`);
    } catch (e: any) {
      this.kick(client, 'Auth error');
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.socketToUser.get(client.id);
    if (!userId) return;
    this.socketToUser.delete(client.id);
    const set = this.userToSockets.get(userId);
    if (set) {
      set.delete(client.id);
      if (set.size === 0) {
        this.userToSockets.delete(userId);
        await this.prisma.pessoa.update({ where: { id: userId }, data: { online: false } }).catch(() => undefined);
        this.logger.debug(`User ${userId} offline`);
      } else {
        this.userToSockets.set(userId, set);
      }
    }
  }

  emitNewMessage(atendimentoCompanyId: number, atendimentoId: number, payload: any) {
    this.server.to(`at:${atendimentoCompanyId}:${atendimentoId}`).emit('message', payload);
  }

  private extractToken(client: Socket): string | undefined {
    const authHeader = client.handshake.headers['authorization'];
    const fromHeader = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;
    const fromQuery = (client.handshake.query?.token as string) || undefined;
    const fromAuth = (client.handshake.auth as any)?.token as string | undefined;
    return fromAuth || fromHeader || fromQuery;
  }

  private async verifyToken(token: string): Promise<any> {
    const secret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
    return this.jwt.verifyAsync(token, { secret });
  }

  private kick(client: Socket, reason: string) {
    try { client.disconnect(true); } catch {}
    this.logger.debug(`Socket ${client.id} disconnected: ${reason}`);
  }
}


