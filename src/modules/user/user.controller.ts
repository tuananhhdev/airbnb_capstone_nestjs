import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { SkipPermission } from 'src/common/decorator/skip-permission.decorator';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('User')
@Controller('users')
class UserController {
  constructor(private readonly userService: UserService) { }

  @SkipPermission()
  @Get('/')
  async findAll(
    @Req()
    req: Request,
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string
  ) {
    return await this.userService.findAll(page, pageSize);
  }

  @Get('/:id')
  async findOne(
    @Param('id')
    id: string
  ) {
    return await this.userService.findOne(id);
  }
}

export default UserController