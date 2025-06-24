import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/common/decorator/public.decorator';
import { AuthenticateRequest } from 'src/common/types/authenticate-request.type';

@ApiTags('Locations')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Get()
  @Public()
  @SuccessMessage('Lấy danh sách vị trí thành công')
  @ApiOperation({ summary: 'Lấy danh sách tất cả vị trí' })
  findAll(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string
  ) {
    return this.locationService.findAll(page, pageSize);
  }

  @Get('pagination-search')
  @Public()
  @SuccessMessage('Lấy danh sách vị trí thành công')
  @ApiOperation({ summary: 'Lấy danh sách tất cả vị trí với phần trang & tìm kiếm' })
  findWithPaginationAndSearch(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string,
    @Query('search')
    search: string
  ) {
    return this.locationService.findWWithPaginationAndSearch(page, pageSize, search);
  }

  @Post()
  @ApiBearerAuth()
  @SuccessMessage('Tạo mới vị trí thành công')
  @ApiOperation({ summary: 'Tạo mới vị trí - Admin only' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        province: { type: 'string' },
        country: { type: 'string' },
        imageLocation: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('imageLocation', {
      limits: {
        fileSize: 1 * 1024 * 1024,
      },
    }),
  )
  create(
    @Body() createLocationDto: CreateLocationDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.locationService.createLocation(createLocationDto, file);
  }

  @Get(':id')
  @Public()
  @SuccessMessage('Tìm vị trí theo theo ID thành công')
  @ApiOperation({ summary: 'Tìm vị trí theo theo ID' })
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @SuccessMessage('Cập nhật vị trí thành công')
  @ApiOperation({ summary: 'Cập nhật vị trí - Admin only' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateLocationDto })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        province: { type: 'string' },
        country: { type: 'string' },
        imageLocation: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('imageLocation', {
      limits: {
        fileSize: 1 * 1024 * 1024,
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.locationService.updateLocation(id, updateLocationDto, file);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @SuccessMessage('Xóa vị trí thành công')
  @ApiOperation({ summary: 'Xóa vị trí (soft delete) - Admin only' })
  @ApiResponse({
    status: 200,
    description: 'Xóa vị trí thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Xóa vị trí thành công' }
      }
    }
  })
  softDelete(@Param('id') id: string, @Req() req: AuthenticateRequest) {
    return this.locationService.softDeleteLocation(id, req.user.id);
  }

}
