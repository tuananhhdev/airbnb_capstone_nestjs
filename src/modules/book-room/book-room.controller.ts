import { Controller } from '@nestjs/common';
import { BookRoomService } from './book-room.service';

@Controller('book-room')
export class BookRoomController {
  constructor(private readonly bookRoomService: BookRoomService) {}
}
