import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ 
    description: 'Nội dung bình luận',
    example: 'Phòng rất đẹp và sạch sẽ!',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Nội dung bình luận phải là chuỗi' })
  content?: string;

  @ApiProperty({ 
    description: 'Điểm đánh giá từ 1-5',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm đánh giá phải là số' })
  @Min(1, { message: 'Điểm đánh giá tối thiểu là 1' })
  @Max(5, { message: 'Điểm đánh giá tối đa là 5' })
  rating?: number;
}
