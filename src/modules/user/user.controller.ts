import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SkipPermission } from 'src/common/decorator/skip-permission.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('users')
class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('/')
  @SkipPermission()
  findAll(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string
  ) {
    return this.userService.findAll(page, pageSize);
  }

  @Get('/:id')
  @SkipPermission()
  findOne(
    @Param('id')
    id: string
  ) {
    return this.userService.findOne(id);
  }

  @Patch('/:id')
  async updateById(
    @Param('id')
    id: string,
    @Body()
    body: UpdateUserDto
  ) {
    return await this.userService.updateById(id, body);
  }

  @Delete('/:id')
  softDelete(
    @Param('id')
    id: string
  ) {
    return this.userService.softDelete(Number(id));
  }

  @Post("upload-avatar")
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Tải ảnh đại diện',
    type: UploadAvatarDto
  })
  uploadAvatar(
    @UploadedFile()
    file: Express.Multer.File,
    @Req()
    req: Request
  ) {
    return this.userService.uploadAvatar(file, req.user)
  }

}

export default UserController