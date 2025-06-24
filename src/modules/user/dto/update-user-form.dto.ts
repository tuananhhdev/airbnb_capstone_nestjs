import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEmail, IsBoolean, Matches, IsDateString } from 'class-validator';

export class UpdateUserFormDto {
    @ApiProperty({
        example: 'Nguyen Van A',
        description: 'Tên đầy đủ của người dùng',
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Tên phải là chuỗi' })
    fullName?: string;

    @ApiProperty({
        example: 'user@example.com',
        description: 'Email của người dùng',
        required: false
    })
    @IsOptional()
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email?: string;

    @ApiProperty({
        example: '0123456789',
        description: 'Số điện thoại',
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Số điện thoại phải là chuỗi' })
    @Matches(/^[0-9]{10}$/, { message: 'Số điện thoại phải có 10 chữ số' })
    phone?: string;

    @ApiProperty({
        example: '1990-01-01',
        description: 'Ngày sinh (YYYY-MM-DD)',
        required: false
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày sinh không hợp lệ (YYYY-MM-DD)' })
    birthday?: string;

    @ApiProperty({
        example: 'true',
        description: 'Giới tính (true: Nam, false: Nữ)',
        required: false
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean({ message: 'Giới tính phải là boolean' })
    gender?: boolean;

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'File ảnh avatar',
        required: false
    })
    @IsOptional()
    avatar?: any;
}
