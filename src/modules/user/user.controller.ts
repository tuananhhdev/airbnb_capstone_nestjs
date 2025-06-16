import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SkipPermission } from 'src/common/decorator/skip-permission.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('User')
@Controller('users')
class UserController {
  constructor(private readonly userService: UserService) { }

  // lấy danh sách tất cả người dùng 
  @Get('/')
  // @Public()
  @SuccessMessage('Lấy danh sách người dùng thành công')
  findAll(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string
  ) {
    return this.userService.findAll(page, pageSize);
  }


  // lấy danh sách người dùng với phân trang và tìm kiếm 
  @Get('phan-trang-tim-kiem')
  @SuccessMessage('Lấy danh sách người dùng thành công')
  findWithPaginationAndSearch(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string,
    @Query('search')
    search: string
  ) {
    return this.userService.findWithPaginationAndSearch(page, pageSize, search);
  }

  @Get('search')
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Số trang' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Số item mỗi trang' })
  @ApiQuery({ name: 'q', type: String, required: false, description: 'Tìm kiếm theo tên' })
  @ApiQuery({ name: 'filters', type: String, required: false, description: 'Filters dưới dạng JSON' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng đã lọc' })
  async findWithSearchName(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('q') search: string,
    @Query('filters') filters: string,
  ) {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    const result = await this.userService.findWithSearchName(page, pageSize, search, parsedFilters);
    const total = result.pagination?.totalItems || 0;

    const message = search || Object.keys(parsedFilters).length > 0
      ? `Tìm thấy ${total} người dùng`
      : `Lấy danh sách người dùng thành công`;

    return { data: result, message };
  }


  // tạo người dúng mới ( Admin ) 
  @Post('/')
  @SuccessMessage('Tạo người dùng mới thành công')
  createUser(
    @Body() createUserDto: CreateUserDto
  ) {
    return this.userService.createUser(createUserDto)
  }


  // tải ảnh đại diện người dùng ( Admin và User ) 
  @Post("upload-avatar")
  @SkipPermission()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Tải ảnh đại diện',
    type: UploadAvatarDto
  })
  @SuccessMessage('Tải ảnh đại diện người dùng thành công')
  uploadAvatar(
    @UploadedFile()
    file: Express.Multer.File,
    @Req()
    req: Request
  ) {
    return this.userService.uploadAvatar(file, req.user)
  }


  // cập nhật thông tin người dùng 
  @Patch('me')
  @SkipPermission()
  @SuccessMessage('Cập nhật thông tin người dùng thành công')
  updateSelf(
    @Req()
    req: Request,
    @Body()
    updateSeflDto: UpdateUserDto
  ) {
    return this.userService.updateSelf(req.user, updateSeflDto)
  }

  // cập nhật ảnh đại diện người dùng
  @Patch('update-avatar')
  @SkipPermission()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Cập nhật ảnh đại diện',
    type: UploadAvatarDto
  })
  @SuccessMessage('Cập nhật ảnh đại diện người dùng thành công')
  updateAvatar(
    @UploadedFile()
    file: Express.Multer.File,
    @Req()
    req: Request

  ) {
    return this.userService.updateAvatar(req.user, file)
  }


  // tìm người dùng theo ID ( Admin )
  @Get(':id')
  @SuccessMessage('Tìm người dùng thành công')
  findOne(
    @Param('id')
    id: string
  ) {
    return this.userService.findOne(id);
  }


  // cập nhật thông tin người dùng theo ID ( Admin )
  @Patch('/:id')
  @SuccessMessage('Cập nhật thông tin người dùng thành công')
  async updateById(
    @Param('id')
    id: string,
    @Body()
    body: UpdateUserDto
  ) {
    return await this.userService.updateById(id, body);
  }


  // xóa mềm người dùng theo ID ( Admin )
  @Delete('/:id')
  @SuccessMessage('Xóa người dùng thành công')
  softDelete(
    @Param('id')
    id: string
  ) {
    return this.userService.softDelete(Number(id));
  }

}

export default UserController