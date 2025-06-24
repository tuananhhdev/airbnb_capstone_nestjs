import { Module } from '@nestjs/common';
import { BookRoomService } from './book-room.service';
import { BookRoomController } from './book-room.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BookRoomController],
  providers: [BookRoomService, PrismaService],
})
export class BookRoomModule { }
