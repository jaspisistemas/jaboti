import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async listForUser(userId: number) {
    const links = await this.prisma.empresaUser.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { company: { id: 'asc' } },
    });
    return links.map((l: any) => l.company);
  }

  async create(dto: CreateCompanyDto, creatorUserId: number) {
    return this.prisma.$transaction(async (tx: any) => {
      const company = await tx.empresa.create({
        data: {
          empRaz: dto.empRaz,
          empCmp: dto.empCmp || 1,
          empVer: dto.empVer || 'v1.0.0',
          empDirFis: dto.empDirFis,
          empDirVir: dto.empDirVir,
          empCodPas: dto.empCodPas || this.generateEmpCodPas(),
          empCodSec: dto.empCodSec,
        },
      });
      await tx.empresaUser.create({
        data: { empCod: company.id, userId: creatorUserId, primary: true },
      });
      return company;
    });
  }

  async update(id: number, dto: UpdateCompanyDto, userId: number) {
    const member = await this.prisma.empresaUser.findUnique({
      where: { empCod_userId: { empCod: id, userId } },
    });
    if (!member) throw new ForbiddenException('Not in company');
    return this.prisma.empresa.update({ where: { id }, data: dto });
  }

  async join(id: number, userId: number) {
    const exists = await this.prisma.empresaUser.findUnique({
      where: { empCod_userId: { empCod: id, userId } },
    });
    if (exists) return { joined: false };
    const company = await this.prisma.empresa.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    await this.prisma.empresaUser.create({ data: { empCod: id, userId } });
    return { joined: true };
  }

  private generateEmpCodPas(): string {
    // Gera "E" + 6 números aleatórios
    const randomNum = randomInt(100000, 999999);
    return `E${randomNum}`;
  }
}
