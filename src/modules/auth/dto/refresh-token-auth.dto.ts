import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class RefreshTokenAuthDto {
    @ApiProperty({default: 'Điền refreshToken vào đây'})
    @IsString({ message: 'Refresh token phải là chuỗi' })
    @IsNotEmpty({ message: 'Refresh token không được để trống' })
    refreshToken: string

    @ApiProperty({default: 'Điền accessToken vào đây'})
    @IsNotEmpty({ message: 'Access token không được để trống' })
    @IsString({ message: 'Access token phải là chuỗi' })
    accessToken: string
}