import { ApiProperty } from '@nestjs/swagger';

export class UploadRoomImagesDto {
    @ApiProperty({
        type: 'array',
        items: {
            type: 'string',
            format: 'binary',
        },
        description: 'Ảnh phòng (tối đa 5 ảnh, mỗi ảnh tối đa 10MB)',
        maxItems: 5,
    })
    imageRoom: Express.Multer.File[];
}
