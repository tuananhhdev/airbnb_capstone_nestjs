import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ 
    description: 'ID phòng được bình luận',
    example: 1 
  })
  @IsNotEmpty({ message: 'roomId không được để trống' })
  @IsNumber({}, { message: 'roomId phải là số' })
  roomId: number;

  @ApiProperty({ 
    description: 'Nội dung bình luận',
    example: 'Phòng rất đẹp và sạch sẽ!' 
  })
  @IsNotEmpty({ message: 'content không được để trống' })
  @IsString({ message: 'content phải là chuỗi' })
  content: string;

  @ApiProperty({ 
    description: 'Điểm đánh giá từ 1-5',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNotEmpty({ message: 'rating không được để trống' })
  @IsNumber({}, { message: 'rating phải là số' })
  @Min(1, { message: 'rating tối thiểu là 1' })
  @Max(5, { message: 'rating tối đa là 5' })
  rating: number;
}
