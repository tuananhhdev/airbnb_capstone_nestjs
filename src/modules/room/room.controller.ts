import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UploadedFiles, UseInterceptors, Patch, Req, BadRequestException } from '@nestjs/common';
import { RoomService } from './room.service';
import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FindRoomsDto } from './dto/find-room.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

import { Public } from 'src/common/decorator/public.decorator';
import { SkipPermission } from 'src/common/decorator/skip-permission.decorator';
import { AuthenticateRequest } from 'src/common/types/authenticate-request.type';



@ApiTags('Rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) { }

  @Get()
  @Public()
  @SuccessMessage('Lấy danh sách phòng thành công')
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Số trang' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Số item mỗi trang' })
  @ApiOperation({ summary: 'Lấy danh sách tất cả phòng (chỉ phân trang)' })
  findAll(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string
  ) {
    return this.roomService.findAll(page, pageSize);
  }

  @Get('pagination-search')
  @Public()
  @SuccessMessage('Lấy danh sách phòng với phân trang và tìm kiếm thành công')
  @ApiOperation({ summary: 'Lấy danh sách phòng với phân trang và tìm kiếm' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Số trang' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Số item mỗi trang' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Tìm kiếm theo tên phòng hoặc mô tả' })
  @ApiQuery({ name: 'locationId', type: Number, required: false, description: 'Lọc theo vị trí' })
  @ApiQuery({ name: 'minPrice', type: Number, required: false, description: 'Giá tối thiểu' })
  @ApiQuery({ name: 'maxPrice', type: Number, required: false, description: 'Giá tối đa' })
  @ApiQuery({ name: 'guestCount', type: Number, required: false, description: 'Số lượng khách' })
  getRoomsWithPaginationAndSearch(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('guestCount') guestCount?: string
  ) {
    return this.roomService.getRoomsWithPaginationAndSearch(
      page,
      pageSize,
      search,
      locationId ? parseInt(locationId) : undefined,
      minPrice ? parseFloat(minPrice) : undefined,
      maxPrice ? parseFloat(maxPrice) : undefined,
      guestCount ? parseInt(guestCount) : undefined
    );
  }







  @Get('by-location')
  @Public()
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
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('imageRoom', 5, {
      limits: {
        fileSize: 1 * 1024 * 1024,
        files: 5,
      },
    })
  )
  @SuccessMessage('Tạo phòng thành công')
  @ApiOperation({ summary: 'Tạo mới phòng - User sẽ tự động được upgrade thành Host' })
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
  @ApiBearerAuth()
  create(
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthenticateRequest
  ) {


    return this.roomService.create(createRoomDto, files, req.user.id);
  }

  @Get(':id')
  @SuccessMessage('Tìm phòng thuê theo ID thành công')
  @ApiOperation({ summary: 'Tìm phòng thuê theo ID' })
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  // Host update phòng của mình
  @Patch('my/:id')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Cập nhật phòng thành công')
  @ApiOperation({ summary: 'Cập nhật phòng của tôi - Host only' })
  @UseInterceptors(FilesInterceptor('imageRoom', 5, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 5,
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        guestCount: { type: 'number' },
        bedroomCount: { type: 'number' },
        bedCount: { type: 'number' },
        bathroomCount: { type: 'number' },
        description: { type: 'string' },
        price: { type: 'number' },
        locationId: { type: 'number' },
        washingMachine: { type: 'boolean' },
        iron: { type: 'boolean' },
        tv: { type: 'boolean' },
        airConditioner: { type: 'boolean' },
        wifi: { type: 'boolean' },
        kitchen: { type: 'boolean' },
        parking: { type: 'boolean' },
        pool: { type: 'boolean' },
        ironingBoard: { type: 'boolean' },
        imageRoom: { type: 'array', items: { type: 'string', format: 'binary' } }
      }
    }
  })
  async updateMyRoom(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthenticateRequest
  ) {
    return this.roomService.update(id, updateRoomDto, files, req.user.id);
  }

  // Admin update bất kỳ phòng nào
  @Patch(':id')
  @ApiBearerAuth()
  @SuccessMessage('Cập nhật phòng thành công')
  @ApiOperation({ summary: 'Cập nhật thông tin phòng - Admin only' })
  @UseInterceptors(FilesInterceptor('imageRoom', 5, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 5,
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
    @Req() req: AuthenticateRequest,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return this.roomService.update(id, updateRoomDto, files, req.user.id);
  }

  @Delete(':id')
  @SuccessMessage('Xóa phòng thành công')
  @ApiOperation({ summary: 'Xóa phòng (soft delete) - Admin hoặc Host' })
  @ApiBearerAuth()
  softDelete(@Param('id') id: string, @Req() req: AuthenticateRequest) {
    return this.roomService.softDelete(id, req.user.id);
  }
}
