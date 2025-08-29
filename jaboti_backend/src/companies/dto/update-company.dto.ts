import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateCompanyDto {
  @ApiProperty({ description: 'Razão social da empresa' })
  @IsString()
  @IsOptional()
  empRaz?: string;

  @ApiProperty({ description: 'Compilação do sistema (sequencial para versão)' })
  @IsNumber()
  @IsOptional()
  empCmp?: number;

  @ApiProperty({ description: 'Versão descritiva' })
  @IsString()
  @IsOptional()
  empVer?: string;

  @ApiProperty({ description: 'Diretório físico base para arquivos' })
  @IsString()
  @IsOptional()
  empDirFis?: string;

  @ApiProperty({ description: 'URL virtual base para arquivos' })
  @IsUrl()
  @IsOptional()
  empDirVir?: string;

  @ApiProperty({ description: 'Código da pasta da empresa' })
  @IsString()
  @IsOptional()
  empCodPas?: string;

  @ApiProperty({ description: 'Código de sincronização com projeto ADM' })
  @IsString()
  @IsOptional()
  empCodSec?: string;
}
