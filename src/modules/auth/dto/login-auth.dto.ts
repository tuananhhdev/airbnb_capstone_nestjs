import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; 

export class LoginAuthDto {
    @ApiProperty({
        description: 'Địa chỉ email của người dùng',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email: string;
    

    @ApiProperty({
        description: 'Mật khẩu của người dùng',
        example: 'Password123!',
        minLength: 6,
        maxLength: 50,
    })
    @IsString({ message: 'Mật khẩu phải là chuỗi' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
    password: string;
}