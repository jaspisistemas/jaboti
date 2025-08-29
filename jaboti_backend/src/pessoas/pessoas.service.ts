import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CodigoSequencialService } from '../common/services/codigo-sequencial.service';
import { DomParCod } from '../common/enums/dom-par-cod.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';

@Injectable()
export class PessoasService {
  constructor(
    private prisma: PrismaService,
    private codigoSequencialService: CodigoSequencialService,
  ) {}

  async list(companyId: number, tipo?: string, q?: string) {
    const where: Prisma.PessoaWhereInput = {
      empCod: companyId,
      ...(tipo ? { type: tipo } : {}),
      ...(q
        ? {
            OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }],
          }
        : {}),
    };
    return this.prisma.pessoa.findMany({ where, orderBy: { name: 'asc' }, take: 100 });
  }

  async listPaged(
    companyId: number,
    opts: { tipo?: string; q?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(opts.page || 1));
    const take = Math.min(200, Math.max(1, Number(opts.limit || 20)));
    const skip = (page - 1) * take;
    const where: Prisma.PessoaWhereInput = {
      empCod: companyId,
      ...(opts.tipo ? { type: opts.tipo } : {}),
      ...(opts.q
        ? {
            OR: [
              { name: { contains: opts.q } },
              { email: { contains: opts.q } },
              { phone: { contains: opts.q } },
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
    console.log('🔍 DEBUG: Iniciando criação de pessoa');
    console.log('🔍 DEBUG: companyId:', companyId);
    console.log('🔍 DEBUG: DTO recebido:', JSON.stringify(dto, null, 2));

    const passwordHash = await this.resolvePasswordHash(dto.type, dto.password);
    console.log('🔍 DEBUG: passwordHash gerado:', passwordHash ? 'SIM' : 'NÃO');

    // Verificar se já existe pessoa com mesmo username (apenas para USUARIOS)
    console.log('🔍 DEBUG: Verificando username duplicado...');

    // Só verificar username para USUARIOS, não para CLIENTES
    if (dto.type === 'USUARIO') {
      const username = dto.user || dto.name?.toLowerCase().replace(/\s+/g, '');
      console.log('🔍 DEBUG: Username a verificar:', username);
      if (username) {
        const existingUser = await this.prisma.pessoa.findFirst({
          where: { user: username },
        });
        if (existingUser) {
          console.log('🔍 DEBUG: Username já existe:', existingUser.id);
          throw new ConflictException('Username já cadastrado');
        }
        console.log('🔍 DEBUG: Username disponível');
      }
    }

    // Gerar código sequencial para a pessoa
    const proximoCodigo = await this.codigoSequencialService.gerarProximoCodigo(
      companyId,
      DomParCod.PESSOA
    );

    // Preparar dados para criação
    const createData: Prisma.PessoaCreateInput = {
      company: { connect: { id: companyId } },
      id: proximoCodigo,
      user: dto.type === 'USUARIO' ? dto.user || dto.name?.toLowerCase().replace(/\s+/g, '') : null,
      name: dto.name || 'Sem Nome', // Campo obrigatório, fallback se necessário
      chatName: dto.chatName || null,
      phone: this.normalizePhone(dto.phone) || null,
      email: dto.email?.trim().toLowerCase() || null,
      documento: this.stripNonDigits(dto.documento) || null,
      tipoDocumento: dto.tipoDocumento?.toUpperCase() || null,
      dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : null,
      genero: dto.genero || null,
      cep: this.stripNonDigits(dto.cep) || null,
      endereco: dto.endereco || null,
      numero: dto.numero || null,
      complemento: dto.complemento || null,
      bairro: dto.bairro || null,
      cidade: dto.cidade || null,
      estado: dto.estado?.toUpperCase() || null,
      empresa: dto.empresa || null,
      cargo: dto.cargo || null,
      origem: dto.origem || null,
      etapa: dto.etapa || null,
      interesses: dto.interesses || null,
      tags: dto.tags ? dto.tags.join(',') : null,
      canalPreferido: dto.canalPreferido || null,
      consenteMarketing: dto.consenteMarketing ?? false,
      whatsappOptIn: dto.whatsappOptIn ?? false,
      ultimoContatoEm: null,
      observacoes: dto.observacoes || null,
      type: dto.type || 'CLIENTE', // Campo obrigatório, fallback se necessário
      passwordHash: passwordHash as string | null,
      role: dto.type === 'USUARIO' ? 'OPERATOR' : 'CLIENT',
      active: true,
      online: false,
    };

    console.log('🔍 DEBUG: Dados preparados para criação:');
    console.log('🔍 DEBUG: createData:', JSON.stringify(createData, null, 2));

    try {
      console.log('🔍 DEBUG: Chamando Prisma.pessoa.create...');
      const result = await this.prisma.pessoa.create({
        data: createData,
      });
      console.log('🔍 DEBUG: Pessoa criada com sucesso! ID:', result.id);
      return result;
    } catch (e: any) {
      console.error('❌ DEBUG: Erro ao criar pessoa');
      console.error('❌ DEBUG: Código do erro:', e?.code);
      console.error('❌ DEBUG: Mensagem do erro:', e?.message);
      console.error('❌ DEBUG: Meta do erro:', JSON.stringify(e?.meta, null, 2));
      console.error('❌ DEBUG: Stack trace:', e?.stack);

      if (e?.code === 'P2002') {
        // Violação de constraint única
        const target = e?.meta?.target;
        console.log('🔍 DEBUG: Constraint violada:', target);
        console.log('🔍 DEBUG: Tipo do target:', typeof target);
        console.log('🔍 DEBUG: Target é array?', Array.isArray(target));

        if (Array.isArray(target)) {
          console.log('🔍 DEBUG: Target é array, verificando conteúdo...');
          if (target.includes('PesUsr')) {
            console.log('🔍 DEBUG: Violação de username único');
            throw new ConflictException('Username já cadastrado');
          }
        } else if (typeof target === 'string') {
          console.log('🔍 DEBUG: Target é string, verificando conteúdo...');
          if (target.includes('user') || target.includes('PesUsr')) {
            console.log('🔍 DEBUG: Violação de username único');
            throw new ConflictException('Username já cadastrado');
          }
        }

        // Fallback genérico
        console.log('🔍 DEBUG: Violação de constraint única não identificada, usando fallback');
        throw new ConflictException('Dados duplicados detectados. Verifique username.');
      }

      console.log('🔍 DEBUG: Erro não é P2002, re-throwing...');
      throw e;
    }
  }

  private async resolvePasswordHash(type: string, provided?: string) {
    console.log('🔍 DEBUG: resolvePasswordHash - type:', type);
    console.log('🔍 DEBUG: resolvePasswordHash - provided:', provided);

    if (type === 'USUARIO') {
      const plain = provided && provided.trim().length >= 6 ? provided : 'changeme';
      console.log('🔍 DEBUG: resolvePasswordHash - senha a usar:', plain);
      const hash = await bcrypt.hash(plain, 10);
      console.log('🔍 DEBUG: resolvePasswordHash - hash gerado:', hash ? 'SIM' : 'NÃO');
      return hash;
    }

    console.log('🔍 DEBUG: resolvePasswordHash - cliente sem senha, retornando null');
    return null; // cliente não tem senha
  }

  async get(companyId: number, id: number) {
    const p = await this.prisma.pessoa.findFirst({
      where: { empCod: companyId, id },
    });
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
    if (dto.dataNascimento != null)
      data.dataNascimento = dto.dataNascimento ? new Date(dto.dataNascimento) : null;
    if (dto.genero != null) data.genero = dto.genero;
    if (dto.cep != null) data.cep = this.stripNonDigits(dto.cep);
    if (dto.estado != null) data.estado = dto.estado?.toUpperCase();
    if (dto.etapa != null) data.etapa = dto.etapa;
    if (dto.canalPreferido != null) data.canalPreferido = dto.canalPreferido;
    try {
      return await this.prisma.pessoa.update({
        where: { empCod_id: { empCod: companyId, id } },
        data,
      });
    } catch (e: any) {
      if (
        e?.code === 'P2002' &&
        (Array.isArray(e?.meta?.target)
          ? e.meta.target.includes('PesUsr')
          : e?.meta?.target === 'PesUsr')
      ) {
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
    console.log('🔍 DEBUG: stripNonDigits - input:', value);
    if (!value) {
      console.log('🔍 DEBUG: stripNonDigits - valor vazio, retornando undefined');
      return undefined;
    }
    const only = String(value).replace(/\D+/g, '');
    const result = only || undefined;
    console.log('🔍 DEBUG: stripNonDigits - resultado:', result);
    return result;
  }

  private normalizePhone(value?: string | null): string | undefined {
    console.log('🔍 DEBUG: normalizePhone - input:', value);
    const only = this.stripNonDigits(value);
    if (!only) {
      console.log('🔍 DEBUG: normalizePhone - sem dígitos, retornando undefined');
      return undefined;
    }
    // Se tem DDI+DDF (ex: 55 11 91234-5678), mantém só dígitos
    console.log('🔍 DEBUG: normalizePhone - resultado:', only);
    return only;
  }

  async remove(companyId: number, id: number) {
    const pessoa = await this.get(companyId, id);

    // Remover foto se existir
    if (pessoa.photoUrl) {
      await this.deleteOldPhotoFile(pessoa.photoUrl);
    }

    // Excluir registros relacionados primeiro (Foreign Keys)
    await this.prisma.$transaction(async (tx) => {
      // 1. Remover associações com empresas
      await tx.empresaUser.deleteMany({
        where: { empCod: companyId, userId: id },
      });

      // 2. Remover associações com departamentos
      await tx.departamentoPessoa.deleteMany({
        where: { empCod: companyId, userId: id },
      });

      // 3. Remover a pessoa
      await tx.pessoa.delete({
        where: { empCod_id: { empCod: companyId, id } },
      });
    });

    return { deleted: true };
  }

  async changePassword(companyId: number, userId: number, dto: ChangePasswordDto) {
    const pessoa = await this.prisma.pessoa.findUnique({
      where: { empCod_id: { empCod: companyId, id: userId } },
    });
    if (!pessoa || pessoa.type !== 'USUARIO') throw new NotFoundException('Usuário não encontrado');
    const ok = await bcrypt.compare(dto.senhaAtual, pessoa.passwordHash || '');
    if (!ok) throw new UnauthorizedException('Senha atual inválida');
    const passwordHash = await bcrypt.hash(dto.novaSenha, 10);
    await this.prisma.pessoa.update({
      where: { empCod_id: { empCod: companyId, id: userId } },
      data: { passwordHash },
    });
    return { changed: true };
  }
}
