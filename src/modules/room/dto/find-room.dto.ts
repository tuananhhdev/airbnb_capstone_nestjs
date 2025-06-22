import { Transform } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class FindRoomsDto {
    @IsOptional()
    @IsNumber(undefined, { message: 'Page phải là số' })
    @Min(1, { message: 'Page phải lớn hơn 0' })
    page: number;

    @IsOptional()
    @IsNumber(undefined, { message: 'pageSize phải là số' })
    @Min(1, { message: 'pageSize phải lớn hơn 0' })
    pageSize: number;

    @IsOptional()
    @IsString({ message: 'Search phải là chuỗi' })
    search?: string;

    @IsOptional()
    @IsInt({ message: 'locationId phải là số' })
    @Min(1, { message: 'locationId phải lớn hơn 0' })
    @Transform(({ value }) => (Number(value) || undefined))
    locationId: number
}