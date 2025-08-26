import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ minLength: 6, example: 'SenhaAtual123' })
  @IsString() @MinLength(6) @MaxLength(72)
  senhaAtual!: string;

  @ApiProperty({ minLength: 6, example: 'NovaSenhaSegura456' })
  @IsString() @MinLength(6) @MaxLength(72)
  novaSenha!: string;
}
