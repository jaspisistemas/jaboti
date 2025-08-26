import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SelectCompanyDto } from './dto/select-company.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
  return this.auth.login({ user: dto.user }, dto.password);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('select-company')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async selectCompany(@Body() dto: SelectCompanyDto, @CurrentUser('sub') userId: number) {
    return this.auth.selectCompany(userId, dto.companyId);
  }
}
