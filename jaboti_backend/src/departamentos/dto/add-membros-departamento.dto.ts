import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMembrosDepartamentoDto {
  @ApiProperty({ example: [3,5,9], description: 'IDs de pessoas (USUARIOS) a adicionar ao departamento' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  pessoaIds!: number[];
}
