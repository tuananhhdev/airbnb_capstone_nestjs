import { IsDate, IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookRoomDto {
    @ApiProperty({ example: 1, description: 'ID của phòng cần đặt' })
    @IsInt()
    @Min(1)
    @IsNotEmpty({ message: 'RoomId không được để trống' })
    roomId: number;

    @ApiProperty({ example: '2024-01-15', description: 'Ngày nhận phòng' })
    @IsDate()
    @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
    @Type(() => Date)
    startDate: Date;

    @ApiProperty({ example: '2024-01-20', description: 'Ngày trả phòng' })
    @IsDate()
    @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
    @Type(() => Date)
    endDate: Date;

    @ApiProperty({ example: 2, description: 'Số lượng khách' })
    @IsInt()
    @Min(1)
    @IsNotEmpty({ message: 'Số lượng khách không được để trống' })
    guestCount: number;
}