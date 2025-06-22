import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionStrategy } from './modules/auth/permission/permission.strategy';
import { ProtectStrategy } from './modules/auth/protect/protect.strategy';
import { TokenModule } from './modules/auth/token/token.module';
import { LocationModule } from './modules/location/location.module';
import { PrismaService } from './modules/prisma/prisma.service';
import { UserModule } from './modules/user/user.module';
import { CommentModule } from './modules/comment/comment.module';
import { RoomModule } from './modules/room/room.module';
import { BookRoomModule } from './modules/book-room/book-room.module';

@Module({
  imports: [AuthModule, TokenModule, UserModule, LocationModule, CommentModule, RoomModule, BookRoomModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, ProtectStrategy, PermissionStrategy],
})
export class AppModule { }
