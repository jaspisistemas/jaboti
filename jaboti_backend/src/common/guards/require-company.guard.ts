import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RequireCompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const companyId = req.user?.activeCompanyId;
    if (!companyId) {
      throw new ForbiddenException('Active company required');
    }
    return true;
  }
}
