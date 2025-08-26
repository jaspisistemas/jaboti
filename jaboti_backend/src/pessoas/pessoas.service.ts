import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Prisma, PessoaTipo } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Using enum string literals to bypass temporary type export issue
type PessoaTipoLocal = PessoaTipo;

@Injectable()
export class PessoasService {
  constructor(private prisma: PrismaService) {}

  async list(companyId: number, tipo?: PessoaTipoLocal, q?: string) {
    const where: Prisma.PessoaWhereInput = {
      companies: { some: { companyId } },
      ...(tipo ? { type: tipo as any } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return this.prisma.pessoa.findMany({ where, orderBy: { name: 'asc' }, take: 100 });
  }

  async listPaged(companyId: number, opts: { tipo?: PessoaTipoLocal; q?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(opts.page || 1));
    const take = Math.min(200, Math.max(1, Number(opts.limit || 20)));
    const skip = (page - 1) * take;
    const where: Prisma.PessoaWhereInput = {
      companies: { some: { companyId } },
      ...(opts.tipo ? { type: opts.tipo as any } : {}),
      ...(opts.q
        ? {
            OR: [
              { name: { contains: opts.q, mode: 'insensitive' } },
              { email: { contains: opts.q, mode: 'insensitive' } },
              { phone: { contains: opts.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.pessoa.count({ where }),
      this.prisma.pessoa.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
    ]);
    return { total, items, page, limit: take };
  }

  async create(companyId: number, dto: CreatePessoaDto) {
    const passwordHash = await this.resolvePasswordHash(dto.type, dto.password);
    try {
      return await this.prisma.pessoa.create({
        data: {
          user: dto.type === PessoaTipo.USUARIO ? (dto.user || dto.name) : undefined,
          name: dto.name,
          chatName: dto.chatName,
          phone: this.normalizePhone(dto.phone),
          email: dto.email?.trim().toLowerCase(),
          documento: this.stripNonDigits(dto.documento),
          tipoDocumento: dto.tipoDocumento?.toUpperCase(),
          dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
          genero: dto.genero as any,
          cep: this.stripNonDigits(dto.cep),
          endereco: dto.endereco,
          numero: dto.numero,
          complemento: dto.complemento,
          bairro: dto.bairro,
          cidade: dto.cidade,
          estado: dto.estado?.toUpperCase(),
          empresa: dto.empresa,
          cargo: dto.cargo,
          origem: dto.origem,
          etapa: dto.etapa as any,
          interesses: dto.interesses as any,
          tags: dto.tags as any,
          canalPreferido: dto.canalPreferido as any,
          consenteMarketing: dto.consenteMarketing ?? false,
          whatsappOptIn: dto.whatsappOptIn ?? false,
          ultimoContatoEm: undefined,
          observacoes: dto.observacoes,
          type: dto.type,
          passwordHash,
          role: 'OPERATOR',
          companies: { create: { companyId, primary: false } },
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002' && Array.isArray(e?.meta?.target) && e.meta.target.includes('PesEml')) {
        throw new ConflictException('Email já cadastrado');
      }
      if (e?.code === 'P2002' && (Array.isArray(e?.meta?.target) ? e.meta.target.includes('PesUsr') : e?.meta?.target === 'PesUsr')) {
        throw new ConflictException('Username já cadastrado');
      }
      if (e?.code === 'P2002' && (e?.meta?.target === 'Pessoa_email_key' || e?.meta?.target === 'PesEml')) {
        // Fallback para variações de meta.target conforme driver/banco
        throw new ConflictException('Email já cadastrado');
      }
      throw e;
    }
  }

  private async resolvePasswordHash(type: PessoaTipo, provided?: string) {
    if (type === PessoaTipo.USUARIO) {
      const plain = provided && provided.trim().length >= 6 ? provided : 'changeme';
      return bcrypt.hash(plain, 10);
    }
    return bcrypt.hash('', 10); // cliente sem senha efetiva
  }

  async get(companyId: number, id: number) {
  const p = await this.prisma.pessoa.findFirst({ where: { id, companies: { some: { companyId } } } });
    if (!p) throw new NotFoundException('Pessoa not found');
    return p;
  }

  async update(companyId: number, id: number, dto: UpdatePessoaDto) {
    const currentPessoa = await this.get(companyId, id);
    const data: any = { ...dto };
    
    // Se está atualizando a foto, remover a foto antiga
    if (dto.photoUrl && dto.photoUrl !== currentPessoa.photoUrl) {
      await this.deleteOldPhotoFile(currentPessoa.photoUrl);
    }
    
    if (dto.user === '') delete data.user; // prevent setting empty
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      delete data.password; // sanitize
    }
    if (dto.phone != null) data.phone = this.normalizePhone(dto.phone);
    if (dto.email != null) data.email = dto.email?.trim().toLowerCase();
    if (dto.documento != null) data.documento = this.stripNonDigits(dto.documento);
    if (dto.tipoDocumento != null) data.tipoDocumento = dto.tipoDocumento?.toUpperCase();
    if (dto.dataNascimento != null) data.dataNascimento = dto.dataNascimento ? new Date(dto.dataNascimento) : null;
    if (dto.genero != null) data.genero = dto.genero as any;
    if (dto.cep != null) data.cep = this.stripNonDigits(dto.cep);
    if (dto.estado != null) data.estado = dto.estado?.toUpperCase();
    if (dto.etapa != null) data.etapa = dto.etapa as any;
    if (dto.canalPreferido != null) data.canalPreferido = dto.canalPreferido as any;
    try {
      return await this.prisma.pessoa.update({ where: { id }, data });
    } catch (e: any) {
      if (e?.code === 'P2002' && (Array.isArray(e?.meta?.target) ? e.meta.target.includes('PesEml') : (e?.meta?.target === 'Pessoa_email_key' || e?.meta?.target === 'PesEml'))) {
        throw new ConflictException('Email já cadastrado');
      }
      if (e?.code === 'P2002' && (Array.isArray(e?.meta?.target) ? e.meta.target.includes('PesUsr') : e?.meta?.target === 'PesUsr')) {
        throw new ConflictException('Username já cadastrado');
      }
      throw e;
    }
  }

  /**
   * Remove arquivo físico da foto antiga
   */
  private async deleteOldPhotoFile(photoUrl?: string | null): Promise<void> {
    if (!photoUrl) return;
    
    try {
      // Extrair o filename da URL
      // URL example: http://192.168.100.46:3523/uploads/profile/uuid.jpg
      const urlParts = photoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const uploadType = urlParts[urlParts.length - 2];
      
      // Só processar se for um upload local (não URLs externas)
      if (uploadType === 'profile' || uploadType === 'chat') {
        const filePath = join(process.cwd(), 'uploads', uploadType, filename);
        
        if (existsSync(filePath)) {
          unlinkSync(filePath);
          console.log(`Foto antiga removida: ${filePath}`);
        }
      }
    } catch (error) {
      console.error('Erro ao remover foto antiga:', error);
      // Não falhamos a operação se não conseguir remover o arquivo
    }
  }

  private stripNonDigits(value?: string | null): string | undefined {
    if (!value) return undefined;
    const only = String(value).replace(/\D+/g, '');
    return only || undefined;
  }

  private normalizePhone(value?: string | null): string | undefined {
    const only = this.stripNonDigits(value);
    if (!only) return undefined;
    // Se tem DDI+DDF (ex: 55 11 91234-5678), mantém só dígitos
    return only;
  }

  async remove(companyId: number, id: number) {
    const pessoa = await this.get(companyId, id);
    
    // Remover foto se existir
    if (pessoa.photoUrl) {
      await this.deleteOldPhotoFile(pessoa.photoUrl);
    }
    
    await this.prisma.pessoa.delete({ where: { id } });
    return { deleted: true };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const pessoa = await this.prisma.pessoa.findUnique({ where: { id: userId } });
  if (!pessoa || pessoa.type !== 'USUARIO') throw new NotFoundException('Usuário não encontrado');
  const ok = await bcrypt.compare(dto.senhaAtual, pessoa.passwordHash || '');
  if (!ok) throw new UnauthorizedException('Senha atual inválida');
    const passwordHash = await bcrypt.hash(dto.novaSenha, 10);
    await this.prisma.pessoa.update({ where: { id: userId }, data: { passwordHash } });
    return { changed: true };
  }
}
