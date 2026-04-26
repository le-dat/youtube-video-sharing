import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}

export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}