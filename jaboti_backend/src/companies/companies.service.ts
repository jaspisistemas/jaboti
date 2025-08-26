import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async listForUser(userId: number) {
  const links = await this.prisma.companyUser.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { company: { createdAt: 'asc' } },
    });
  return links.map((l: any) => l.company);
  }

  async create(dto: CreateCompanyDto, creatorUserId: number) {
  return this.prisma.$transaction(async (tx: any) => {
      const company = await tx.company.create({ data: { name: dto.name } });
      await tx.companyUser.create({
        data: { companyId: company.id, userId: creatorUserId, primary: true },
      });
      return company;
    });
  }

  async update(id: number, dto: UpdateCompanyDto, userId: number) {
    const member = await this.prisma.companyUser.findUnique({
      where: { companyId_userId: { companyId: id, userId } },
    });
    if (!member) throw new ForbiddenException('Not in company');
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async join(id: number, userId: number) {
    const exists = await this.prisma.companyUser.findUnique({
      where: { companyId_userId: { companyId: id, userId } },
    });
    if (exists) return { joined: false };
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    await this.prisma.companyUser.create({ data: { companyId: id, userId } });
    return { joined: true };
  }
}
