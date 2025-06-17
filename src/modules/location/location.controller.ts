import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Locations')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Get()
  @SuccessMessage('Lấy danh sách vị trí thành công')
  @ApiOperation({ summary: 'Lấy danh sách tất cả vị trí ' })
  findAll(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string
  ) {
    return this.locationService.findAll(page, pageSize);
  }

  @Get('phan-trang-tim-kiem')
  @SuccessMessage('Lấy danh sách vị trí thành công')
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
  @ApiOperation({ summary: 'Tạo mới vị trí' })
  @ApiResponse({ status: 201, description: 'Tạo mới vị trí thành công' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
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
  @SuccessMessage('Tìm vị trí theo theo ID thành công')
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }

}
