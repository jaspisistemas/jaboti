import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  private async ensureMembership(empCod: number, userId: number) {
    const rel = await this.prisma.empresaUser.findUnique({
      where: { empCod_userId: { empCod: empCod, userId } },
    });
    if (!rel) throw new ForbiddenException('User not in company');
  }

  async list(empCod: number, userId: number) {
    await this.ensureMembership(empCod, userId);
    return this.prisma.departamento.findMany({ where: { empCod }, orderBy: { depNom: 'asc' } });
  }

  async create(empCod: number, userId: number, dto: CreateDepartmentDto) {
    await this.ensureMembership(empCod, userId);
    return this.prisma.departamento.create({ data: { depNom: dto.nome, empCod, id: 1 } });
  }

  async update(empCod: number, id: number, userId: number, dto: UpdateDepartmentDto) {
    await this.ensureMembership(empCod, userId);
    const dep = await this.prisma.departamento.findFirst({ where: { id, empCod } });
    if (!dep) throw new NotFoundException('Department not found');
    return this.prisma.departamento.update({
      where: { empCod_id: { empCod: empCod, id } },
      data: { depNom: dto.nome ?? dep.depNom },
    });
  }

  async remove(empCod: number, id: number, userId: number) {
    await this.ensureMembership(empCod, userId);
    const dep = await this.prisma.departamento.findFirst({ where: { id, empCod } });
    if (!dep) throw new NotFoundException('Department not found');
    await this.prisma.departamento.delete({ where: { empCod_id: { empCod: empCod, id } } });
    return { deleted: true };
  }

  async get(empCod: number, id: number, userId: number) {
    await this.ensureMembership(empCod, userId);
    const dep = await this.prisma.departamento.findFirst({ where: { id, empCod } });
    if (!dep) throw new NotFoundException('Department not found');
    return dep;
  }
}
