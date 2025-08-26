import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Login por username (campo user)
  @IsString()
  @IsNotEmpty()
  user!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
