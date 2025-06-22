import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UploadedFiles, UseInterceptors, Patch, Req } from '@nestjs/common';
import { RoomService } from './room.service';
import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FindRoomsDto } from './dto/find-room.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SkipPermission } from 'src/common/decorator/skip-permission.decorator';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) { }

  @Get('/')
  @Public()
  @SuccessMessage('Lấy danh sách phòng thành công')
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Số trang' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Số item mỗi trang' })
  @ApiOperation({ summary: 'Lấy danh sách tất cả phòng' })
  findAll(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string
  ) {
    return this.roomService.findAll(page, pageSize);
  }


  @Get('phan-trang-tim-kiem')
  @Public()
  @SuccessMessage('Lấy danh sách phòng thành công')
  @ApiOperation({ summary: 'Lấy danh sách tất cả phòng với phân trang & tìm kiếm' })
  findWithPaginationAndSearch(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string,
    @Query('search')
    search: string
  ) {
    return this.roomService.findWithPaginationAndSearch(page, pageSize, search);
  }

  @Get('lay-phong-theo-vi-tri')
  @SkipPermission()
  @SuccessMessage('Lấy danh sách phòng theo vị trí thành công')
  @ApiOperation({ summary: 'Lấy danh sách phòng theo vị trí' })
  findRoomByLocation(
    @Query('locationId', ParseIntPipe) locationId: string,
    @Query() query: FindRoomsDto
  ) {
    return this.roomService.findRoomByLocation(locationId, query);
  }

  @Post()
  @SkipPermission()
  @UseInterceptors(
    FilesInterceptor('imageRoom', 5, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 5, // Maximum 5 files
      },
    })
  )
  @SuccessMessage('Tạo phòng thành công')
  @ApiOperation({ summary: 'Tạo mới phòng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Căn hộ cao cấp view biển' },
        guestCount: { type: 'integer', example: 4 },
        bedroomCount: { type: 'integer', example: 2 },
        bedCount: { type: 'integer', example: 3 },
        bathroomCount: { type: 'integer', example: 2 },
        description: { type: 'string', example: 'Căn hộ sang trọng với view biển tuyệt đẹp...' },
        price: { type: 'number', example: 1500000 },
        locationId: { type: 'integer', example: 1 },
        washingMachine: { type: 'boolean', example: true },
        iron: { type: 'boolean', example: true },
        tv: { type: 'boolean', example: true },
        airConditioner: { type: 'boolean', example: true },
        wifi: { type: 'boolean', example: true },
        kitchen: { type: 'boolean', example: true },
        parking: { type: 'boolean', example: true },
        pool: { type: 'boolean', example: false },
        ironingBoard: { type: 'boolean', example: true },
        imageRoom: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Ảnh phòng (tối đa 5 ảnh)',
        },
      },
      required: ['name', 'guestCount', 'bedroomCount', 'bedCount', 'bathroomCount', 'price', 'locationId'],
    },
  })
  @SkipPermission()
  @ApiBearerAuth()
  create(
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request
  ) {
    const userId = req['user']?.id
    return this.roomService.create(createRoomDto, files, userId);
  }

  @Get(':id')
  @Public()
  @SuccessMessage('Tìm phòng thuê theo ID thành công')
  @ApiOperation({ summary: 'Tìm phòng thuê theo ID' })
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  @Patch(':id')
  @SkipPermission()
  @SuccessMessage('Cập nhật phòng thành công')
  @ApiOperation({ summary: 'Cập nhật thông tin phòng' })
  @UseInterceptors(FilesInterceptor('imageRoom', 5, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 5, // Maximum 5 files
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Căn hộ cao cấp view biển (updated)' },
        guestCount: { type: 'integer', example: 6 },
        bedroomCount: { type: 'integer', example: 3 },
        bedCount: { type: 'integer', example: 4 },
        bathroomCount: { type: 'integer', example: 2 },
        description: { type: 'string', example: 'Căn hộ đã được nâng cấp với view biển tuyệt đẹp...' },
        price: { type: 'number', example: 2000000 },
        locationId: { type: 'integer', example: 2 },
        washingMachine: { type: 'boolean', example: true },
        iron: { type: 'boolean', example: true },
        tv: { type: 'boolean', example: true },
        airConditioner: { type: 'boolean', example: true },
        wifi: { type: 'boolean', example: true },
        kitchen: { type: 'boolean', example: true },
        parking: { type: 'boolean', example: true },
        pool: { type: 'boolean', example: true },
        ironingBoard: { type: 'boolean', example: true },
        imageRoom: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Ảnh phòng mới (tùy chọn, tối đa 5 ảnh)',
        },
      },
    },
  })
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFiles() files?: Express.Multer.File[]

  ) {
    return this.roomService.update(id, updateRoomDto, files);
  }

  @Delete(':id')
  @SkipPermission()
  @SuccessMessage('Xóa phòng thành công')
  @ApiOperation({ summary: 'Xóa phòng (soft delete)' })
  @ApiBearerAuth()
  softDelete(@Param('id') id: string) {
    return this.roomService.softDelete(id);
  }
}
