import { Controller, Get, Post, Body, Put, Param, Delete, Query, Req, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { SkipPermission } from 'src/common/decorator/skip-permission.decorator';
import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';
import { AuthenticateRequest } from 'src/common/types/authenticate-request.type';

@ApiTags('Comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  // 1. GET /api/comment - Lấy tất cả bình luận
  @Get()
  @ApiBearerAuth()
  @SuccessMessage('Lấy danh sách bình luận thành công')
  @ApiOperation({ summary: 'Lấy tất cả bình luận - Admin only' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  async findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10'
  ) {
    return this.commentService.findAll(page, pageSize);
  }

  // 2. POST /api/comment - Tạo bình luận mới
  @Post()
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Tạo bình luận thành công')
  @ApiOperation({ summary: 'Tạo bình luận mới' })
  async create(@Body() createCommentDto: CreateCommentDto, @Req() req: AuthenticateRequest) {
    return this.commentService.create(createCommentDto, req.user.id);
  }

  // 3. GET /api/comment/:id - Lấy chi tiết bình luận
  @Get(':id')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Lấy chi tiết bình luận thành công')
  @ApiOperation({ summary: 'Lấy chi tiết bình luận' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.findOne(id);
  }

  // 4. PATCH /api/comment/:id - Cập nhật bình luận
  @Patch(':id')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Cập nhật bình luận thành công')
  @ApiOperation({ summary: 'Cập nhật bình luận' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: AuthenticateRequest
  ) {
    return this.commentService.update(id, updateCommentDto, req.user.id);
  }

  // 5. DELETE /api/comment/:id - Xóa bình luận
  @Delete(':id')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Xóa bình luận thành công')
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticateRequest) {
    return this.commentService.remove(id, req.user.id);
  }

  // 6. GET /api/comment/by-room/:roomId - Lấy bình luận theo phòng
  @Get('by-room/:roomId')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Lấy bình luận theo phòng thành công')
  @ApiOperation({ summary: 'Lấy bình luận theo phòng' })
  @ApiParam({ name: 'roomId', type: Number })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  async getCommentsByRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10'
  ) {
    return this.commentService.getCommentsByRoom(roomId, page, pageSize);
  }

}
