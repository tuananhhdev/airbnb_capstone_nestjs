import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsBoolean, IsOptional, IsNotEmpty, IsInt } from 'class-validator';

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

  @ApiProperty({ description: 'Giới tính', example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'Giới tính phải là boolean' })
  gender?: boolean;

  @ApiProperty({ description: 'ID vai trò', example: 2, default: 2, required: false })
  @IsOptional()
  @IsInt({ message: 'RoleId phải là số nguyên' })
  roleId?: number;
}