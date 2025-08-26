import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  private async ensureMembership(companyId: number, userId: number) {
    const rel = await this.prisma.companyUser.findUnique({
      where: { companyId_userId: { companyId, userId } },
    });
    if (!rel) throw new ForbiddenException('User not in company');
  }

  async list(companyId: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    return this.prisma.department.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async create(companyId: number, userId: number, dto: CreateDepartmentDto) {
    await this.ensureMembership(companyId, userId);
    return this.prisma.department.create({ data: { name: dto.nome, companyId } });
  }

  async update(companyId: number, id: number, userId: number, dto: UpdateDepartmentDto) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!dep) throw new NotFoundException('Department not found');
    return this.prisma.department.update({ where: { id }, data: { name: dto.nome ?? dep.name } });
  }

  async remove(companyId: number, id: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!dep) throw new NotFoundException('Department not found');
    await this.prisma.department.delete({ where: { id } });
    return { deleted: true };
  }

  async get(companyId: number, id: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!dep) throw new NotFoundException('Department not found');
    return dep;
  }
}
