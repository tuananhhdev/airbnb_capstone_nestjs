import { Controller, Post, Body, Req, Get, Query, Delete, Param, ParseIntPipe, Put, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BookRoomService } from './book-room.service';
import { CreateBookRoomDto } from './dto/create-book-room.dto';
import { UpdateBookRoomDto } from './dto/update-book-room.dto';
import { SkipPermission } from 'src/common/decorator/skip-permission.decorator';

import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';
import { AuthenticateRequest } from 'src/common/types/authenticate-request.type';

@ApiTags('Book Room')
@Controller('book-room')
export class BookRoomController {
  constructor(private readonly bookRoomService: BookRoomService) { }

  // 1. GET /api/book-room - Lấy tất cả đặt phòng (Admin only)
  @Get()
  @ApiBearerAuth()
  @SuccessMessage('Lấy danh sách đặt phòng thành công')
  @ApiOperation({ summary: 'Lấy tất cả đặt phòng - Admin only' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  async getAllBookings(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.bookRoomService.findAllBookings(page, pageSize);
  }

  // 2. POST /api/book-room - Đặt phòng
  @Post()
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Đặt phòng thành công')
  @ApiOperation({ summary: 'Đặt phòng' })
  async createBooking(@Body() createBookRoomDto: CreateBookRoomDto, @Req() req: AuthenticateRequest) {
    return this.bookRoomService.bookRoom(createBookRoomDto, req.user.id);
  }

  // 3. GET /api/book-room/my-bookings - Lấy đặt phòng của tôi
  @Get('my-bookings')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Lấy danh sách đặt phòng của tôi thành công')
  @ApiOperation({ summary: 'Lấy danh sách đặt phòng của tôi' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  async getMyBookings(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req: AuthenticateRequest
  ) {
    return this.bookRoomService.findBookingsByUser(req.user.id, page, pageSize, req.user.id);
  }

  // 4. GET /api/book-room/:id - Lấy chi tiết đặt phòng (User và Admin)
  @Get(':id')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Lấy chi tiết đặt phòng thành công')
  @ApiOperation({ summary: 'Lấy chi tiết đặt phòng - User và Admin' })
  @ApiParam({ name: 'id', type: Number })
  async getBookingDetail(@Param('id') id: string, @Req() req: AuthenticateRequest) {
    return this.bookRoomService.findBookingDetail(Number(id), req.user.id);
  }

  // 5. PUT /api/book-room/:id - Cập nhật đặt phòng (User và Admin)
  @Patch(':id')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Cập nhật đặt phòng thành công')
  @ApiOperation({ summary: 'Cập nhật đặt phòng - User và Admin' })
  @ApiParam({ name: 'id', type: Number })
  async updateBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookRoomDto: UpdateBookRoomDto,
    @Req() req: AuthenticateRequest
  ) {
    return this.bookRoomService.updateBooking(id, updateBookRoomDto, req.user.id);
  }

  // 6. DELETE /api/book-room/:id - Hủy đặt phòng (User và Admin)
  @Delete(':id')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Hủy đặt phòng thành công')
  @ApiOperation({ summary: 'Hủy đặt phòng - User và Admin' })
  @ApiParam({ name: 'id', type: Number })
  async cancelBooking(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticateRequest) {
    return this.bookRoomService.cancelBooking(id, req.user.id);
  }

  // 7. PATCH /api/book-room/confirm/:id - Xác nhận đặt phòng (Host only)
  @Patch('confirm/:id')
  @SkipPermission()
  @ApiBearerAuth()
  @SuccessMessage('Xác nhận đặt phòng thành công')
  @ApiOperation({ summary: 'Xác nhận đặt phòng - Host only' })
  @ApiParam({ name: 'id', type: Number })
  async confirmBooking(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticateRequest) {
    return this.bookRoomService.confirmBooking(id, req.user.id);
  }

  // 8. GET /api/book-room/by-user/:userId - Lấy đặt phòng theo user (Admin only)
  @Get('by-user/:userId')
  @ApiBearerAuth()
  @SuccessMessage('Lấy danh sách đặt phòng theo người dùng thành công')
  @ApiOperation({ summary: 'Lấy đặt phòng theo người dùng - Admin only' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  async getBookingsByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req: AuthenticateRequest
  ) {
    return this.bookRoomService.findBookingsByUser(userId, page, pageSize, req.user.id);
  }
}
