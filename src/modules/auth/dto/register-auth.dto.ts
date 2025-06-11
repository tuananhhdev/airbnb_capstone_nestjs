import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAuthDto {
    @ApiProperty({
        description: 'Địa chỉ email của người dùng',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email: string;


    @ApiProperty({
        description: 'Mật khẩu của người dùng (ít nhất 8 ký tự, có chữ cái, số, và ký tự đặc biệt)',
        example: 'Password123!',
        minLength: 8,
        maxLength: 50,
    })
    @IsString({ message: 'Mật khẩu phải là chuỗi' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Mật khẩu phải chứa ít nhất một chữ cái, một số, và một ký tự đặc biệt (@$!%*?&)',
    })
    password: string;

    
    @ApiProperty({
        description: 'Tên đầy đủ của người dùng',
        example: 'Nguyen Van A',
    })
    @IsString({ message: 'Tên phải là chuỗi' })
    @IsNotEmpty({ message: 'Tên không được để trống' })
    @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
    @MaxLength(50, { message: 'Tên không được vượt quá 50 ký tự' })
    fullName: string;


}