import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Razão social da empresa' })
  @IsString()
  @IsNotEmpty()
  empRaz!: string;

  @ApiProperty({ description: 'Compilação do sistema (sequencial para versão)', default: 1 })
  @IsNumber()
  @IsOptional()
  empCmp?: number;

  @ApiProperty({ description: 'Versão descritiva', default: 'v1.0.0' })
  @IsString()
  @IsOptional()
  empVer?: string;

  @ApiProperty({ description: 'Diretório físico base para arquivos' })
  @IsString()
  @IsNotEmpty()
  empDirFis!: string;

  @ApiProperty({ description: 'URL virtual base para arquivos' })
  @IsUrl()
  @IsNotEmpty()
  empDirVir!: string;

  @ApiProperty({ description: 'Código da pasta da empresa' })
  @IsString()
  @IsOptional()
  empCodPas?: string;

  @ApiProperty({ description: 'Código de sincronização com projeto ADM' })
  @IsString()
  @IsOptional()
  empCodSec?: string;
}
