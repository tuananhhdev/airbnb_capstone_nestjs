import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Get()
  @SuccessMessage('Lấy danh sách vị trí thành công')
  findAll(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string
  ) {
    return this.locationService.findAll(page, pageSize);
  }
}
