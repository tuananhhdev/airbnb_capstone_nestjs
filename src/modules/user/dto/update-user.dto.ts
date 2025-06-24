import { IsOptional, IsString, IsEmail, IsDate, IsBoolean, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
    @ApiProperty({ example: 'Nguyen Van A', description: 'Tên đầy đủ của người dùng' })
    @IsOptional()
    @IsString({ message: 'Tên phải là chuỗi' })
    fullName?: string;


    @ApiProperty({ example: 'user@example.com', description: 'Email của người dùng' })
    @IsOptional()
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email?: string;


    @ApiProperty({ example: '0123456789', description: 'Số điện thoại' })
    @IsOptional()
    @IsString({ message: 'Số điện thoại phải là chuỗi' })
    @Matches(/^[0-9]{10}$/, { message: 'Số điện thoại phải có 10 chữ số' })
    phone?: string;


    @ApiProperty({ example: '1990-01-01', description: 'Ngày sinh' })
    @IsOptional()
    @IsDate({ message: 'Ngày sinh không hợp lệ' })
    birthday?: Date;


    @ApiProperty({ example: true, description: 'Giới tính (true: Nam, false: Nữ)' })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === '1' || value === 1) return true;
        if (value === 'false' || value === false || value === '0' || value === 0) return false;
        return value;
    })
    @IsBoolean({ message: 'Giới tính phải là boolean (true/false, 1/0)' })
    gender?: boolean;


}