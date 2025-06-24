import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SkipPermission } from 'src/common/decorator/skip-permission.decorator';
import { AuthenticateRequest } from 'src/common/types/authenticate-request.type';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserFormDto } from './dto/update-user-form.dto';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';

@ApiTags('User')
@Controller('users')
class UserController {
  constructor(private readonly userService: UserService) { }

  // lấy danh sách tất cả người dùng (Admin only)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng - Admin only' })
  @SuccessMessage('Lấy danh sách người dùng thành công')
  findAll(
    @Query('page')
    page: string,
    @Query('pageSize')
    pageSize: string
  ) {
    return this.userService.findAll(page, pageSize);
  }


  // lấy danh sách người dùng với phân trang và tìm kiếm (Admin only)
  @Get('pagination-search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách người dùng với phân trang và tìm kiếm - Admin only' })
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

  // search nâng cao (Admin only)
  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tìm kiếm người dùng nâng cao với filters - Admin only' })
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


  // tạo người dùng mới với avatar ( Admin )
  @Post()
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('avatar', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiOperation({ summary: 'Tạo người dùng mới với avatar - Admin only' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        phone: { type: 'string' },
        birthday: { type: 'string', format: 'date' },
        gender: { type: 'boolean' },
        roleId: { type: 'number' },
        avatar: { type: 'string', format: 'binary' }
      }
    }
  })
  @SuccessMessage('Tạo người dùng mới thành công')
  createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() avatar?: Express.Multer.File
  ) {
    return this.userService.createUser(createUserDto, avatar)
  }


  // cập nhật thông tin người dùng (bao gồm avatar)
  @Patch('me')
  @SkipPermission()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân (bao gồm avatar)' })
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Cập nhật thông tin người dùng (form data)',
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string', description: 'Tên đầy đủ' },
        email: { type: 'string', description: 'Email' },
        phone: { type: 'string', description: 'Số điện thoại' },
        birthday: { type: 'string', format: 'date', description: 'Ngày sinh' },
        gender: { type: 'boolean', description: 'Giới tính (true: Nam, false: Nữ)' },
        avatar: { type: 'string', format: 'binary', description: 'File ảnh avatar' }
      }
    }
  })
  @SuccessMessage('Cập nhật thông tin người dùng thành công')
  updateSelf(
    @Req() req: Request,
    @Body() updateSelfDto: UpdateUserFormDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    // Convert birthday string to Date if provided
    const processedDto = {
      ...updateSelfDto,
      birthday: updateSelfDto.birthday ? new Date(updateSelfDto.birthday) : undefined
    };

    return this.userService.updateSelf(req.user, processedDto, file);
  }

  // upload avatar riêng cho user đã đăng nhập
  @Post('upload-avatar')
  @SkipPermission()
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('avatar', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiOperation({ summary: 'Upload ảnh đại diện cho user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'File ảnh avatar' }
      }
    }
  })
  @SuccessMessage('Tải lên ảnh đại diện thành công')
  uploadAvatar(
    @Req() req: AuthenticateRequest,
    @UploadedFile() avatar: Express.Multer.File
  ) {
    return this.userService.uploadAvatar(req.user.id, avatar);
  }


  // tìm người dùng theo ID ( Admin )
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tìm người dùng theo ID - Admin only' })
  @SuccessMessage('Tìm người dùng thành công')
  findOne(
    @Param('id')
    id: string
  ) {
    return this.userService.findOne(id);
  }


  // cập nhật thông tin người dùng theo ID với avatar ( Admin only )
  @Patch('/:id')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('avatar', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng theo ID với avatar - Admin only' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        birthday: { type: 'string', format: 'date' },
        gender: { type: 'boolean' },
        roleId: { type: 'number' },
        avatar: { type: 'string', format: 'binary' }
      }
    }
  })
  @SuccessMessage('Cập nhật thông tin người dùng thành công')
  async updateById(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File
  ) {
    return await this.userService.updateById(id, body, avatar);
  }


  // xóa mềm người dùng theo ID ( Admin only )
  @Delete('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa người dùng theo ID - Admin only' })
  @SuccessMessage('Xóa người dùng thành công')
  softDelete(
    @Param('id')
    id: string
  ) {
    return this.userService.softDelete(Number(id));
  }

}

export default UserController