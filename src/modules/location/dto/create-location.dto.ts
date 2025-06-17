import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateLocationDto {
    @IsString({ message: 'Name phải là chuỗi' })
    @IsNotEmpty({ message: 'Name không được bỏ trống' })
    @ApiProperty({ default: 'Điền name vào đây' })
    name: string;

    @IsString({ message: 'Province phải là chuỗi' })
    @IsNotEmpty({ message: 'Province không được bỏ trống' })
    @ApiProperty({ default: 'Điền province vào đây' })
    province: string;

    @IsString({ message: 'Country phải là chuỗi' })
    @IsNotEmpty({ message: 'Country không được bỏ trống' })
    @ApiProperty({ default: 'Điền country vào đây' })
    country: string;
}
