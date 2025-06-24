import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsBoolean, IsOptional, IsNotEmpty, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'Họ và tên', example: 'Nguyen Van A', required: true })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi' })
  fullName: string;

  @ApiProperty({ description: 'Email', example: 'user@example.com', required: true })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'password123', required: true })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  password: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0901234567', required: false })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

  @ApiProperty({ description: 'Ngày sinh', example: '1990-01-01', required: false })
  @IsOptional()
  @IsString({ message: 'Ngày sinh phải là chuỗi định dạng YYYY-MM-DD' })
  birthday?: string;

  @ApiProperty({ description: 'Ảnh đại diện', example: 'avatar123', required: false })
  @IsOptional()
  @IsString({ message: 'Ảnh đại diện phải là chuỗi' })
  avatar?: string;

  @ApiProperty({ description: 'Giới tính (true=nam, false=nữ)', example: true, required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1' || value === 1) return true;
    if (value === 'false' || value === false || value === '0' || value === 0) return false;
    return value;
  })
  @IsBoolean({ message: 'Giới tính phải là boolean (true/false, 1/0)' })
  gender?: boolean;

  @ApiProperty({ description: 'ID vai trò', example: 2, default: 2, required: false })
  @IsOptional()
  @IsInt({ message: 'RoleId phải là số nguyên' })
  roleId?: number;
}