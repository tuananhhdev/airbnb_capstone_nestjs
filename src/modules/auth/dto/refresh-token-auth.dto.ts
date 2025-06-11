import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class RefreshTokenAuthDto {
    @ApiProperty({
        description: 'Refresh token để tạo lại access token',
        example: 'your-refresh-token-here',
    })
    @IsString({ message: 'Refresh token phải là chuỗi' })
    @IsNotEmpty({ message: 'Refresh token không được để trống' })
    refreshToken: string

    @ApiProperty({
        description: 'Access token hiện tại (tùy chọn để invalidate)',
        example: 'your-access-token-here',
    })
    @IsNotEmpty({ message: 'Access token không được để trống' })
    @IsString({ message: 'Access token phải là chuỗi' })
    accessToken: string
}