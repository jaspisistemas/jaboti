import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { AtendimentosService } from './atendimentos.service';
import { AtendimentosController } from './atendimentos.controller';
import { AtendimentosGateway } from './atendimentos.gateway';

@Module({
  imports: [PrismaModule, JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret' })],
  providers: [AtendimentosService, AtendimentosGateway],
  controllers: [AtendimentosController],
  exports: [AtendimentosService],
})
export class AtendimentosModule {}


