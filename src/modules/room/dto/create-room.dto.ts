import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsInt,
    Min,
    Max,
    IsOptional,
    IsBoolean,
    IsNumber,
    MinLength,
    MaxLength
} from 'class-validator';

export class CreateRoomDto {
    @ApiProperty({
        example: 'Căn hộ cao cấp view biển',
        description: 'Tên phòng/căn hộ',
        minLength: 3,
        maxLength: 255
    })
    @IsString({ message: 'Tên phòng phải là chuỗi' })
    @IsNotEmpty({ message: 'Tên phòng không được để trống' })
    @MinLength(3, { message: 'Tên phòng phải có ít nhất 3 ký tự' })
    @MaxLength(255, { message: 'Tên phòng không được vượt quá 255 ký tự' })
    name: string;

    @ApiProperty({
        example: 4,
        description: 'Số lượng khách tối đa',
        minimum: 1,
        maximum: 20
    })
    @IsInt({ message: 'Số lượng khách phải là số nguyên' })
    @Min(1, { message: 'Số lượng khách phải ít nhất là 1' })
    @Max(20, { message: 'Số lượng khách không được vượt quá 20' })
    @Type(() => Number)
    guestCount: number;

    @ApiProperty({
        example: 2,
        description: 'Số phòng ngủ',
        minimum: 0,
        maximum: 10
    })
    @IsInt({ message: 'Số phòng ngủ phải là số nguyên' })
    @Min(0, { message: 'Số phòng ngủ không được âm' })
    @Max(10, { message: 'Số phòng ngủ không được vượt quá 10' })
    @Type(() => Number)
    bedroomCount: number;

    @ApiProperty({
        example: 3,
        description: 'Số giường',
        minimum: 1,
        maximum: 20
    })
    @IsInt({ message: 'Số giường phải là số nguyên' })
    @Min(1, { message: 'Số giường phải ít nhất là 1' })
    @Max(20, { message: 'Số giường không được vượt quá 20' })
    @Type(() => Number)
    bedCount: number;

    @ApiProperty({
        example: 2,
        description: 'Số phòng tắm',
        minimum: 1,
        maximum: 10
    })
    @IsInt({ message: 'Số phòng tắm phải là số nguyên' })
    @Min(1, { message: 'Số phòng tắm phải ít nhất là 1' })
    @Max(10, { message: 'Số phòng tắm không được vượt quá 10' })
    @Type(() => Number)
    bathroomCount: number;

    @ApiProperty({
        example: 'Căn hộ sang trọng với view biển tuyệt đẹp, đầy đủ tiện nghi hiện đại...',
        description: 'Mô tả chi tiết về phòng',
        required: false,
        maxLength: 2000
    })
    @IsOptional()
    @IsString({ message: 'Mô tả phải là chuỗi' })
    @MaxLength(2000, { message: 'Mô tả không được vượt quá 2000 ký tự' })
    description?: string;

    @ApiProperty({
        example: 1500000,
        description: 'Giá phòng mỗi đêm (VNĐ)',
        minimum: 0
    })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Giá phòng phải là số hợp lệ' })
    @Min(0, { message: 'Giá phòng không được âm' })
    @Type(() => Number)
    price: number;

    @ApiProperty({
        example: 1,
        description: 'ID vị trí',
        minimum: 1
    })
    @IsInt({ message: 'ID vị trí phải là số nguyên' })
    @Min(1, { message: 'ID vị trí phải lớn hơn 0' })
    @Type(() => Number)
    locationId: number;

    // Tiện ích phòng
    @ApiProperty({
        example: true,
        description: 'Có máy giặt',
        default: false,
        required: false
    })
    @IsBoolean({ message: 'Máy giặt phải là boolean' })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
    })
    washingMachine?: boolean = false;

    @ApiProperty({
        example: true,
        description: 'Có bàn ủi',
        default: false,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Bàn ủi phải là boolean' })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
    })
    iron?: boolean = false;

    @ApiProperty({
        example: true,
        description: 'Có TV',
        default: false,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'TV phải là boolean' })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
    })
    tv?: boolean = false;

    @ApiProperty({
        example: true,
        description: 'Có điều hòa',
        default: false,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Điều hòa phải là boolean' })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
    })
    airConditioner?: boolean = false;

    @ApiProperty({
        example: true,
        description: 'Có WiFi',
        default: false,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'WiFi phải là boolean' })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
    })
    wifi?: boolean = false;

    @ApiProperty({
        example: true,
        description: 'Có bếp',
        default: false,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Bếp phải là boolean' })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
    })
    kitchen?: boolean = false;

    @ApiProperty({
        example: true,
        description: 'Có chỗ đậu xe',
        default: false,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Chỗ đậu xe phải là boolean' })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
    })
    parking?: boolean = false;

    @ApiProperty({
        example: true,
        description: 'Có hồ bơi',
        default: false,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Hồ bơi phải là boolean' })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
    })
    pool?: boolean = false;

    @ApiProperty({
        example: true,
        description: 'Có bàn ủi đồ',
        default: false,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Bàn ủi đồ phải là boolean' })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
    })
    ironingBoard?: boolean = false;

}