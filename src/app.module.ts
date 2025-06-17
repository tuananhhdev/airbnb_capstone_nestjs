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

@Module({
  imports: [AuthModule, TokenModule, UserModule, LocationModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, ProtectStrategy, PermissionStrategy],
})
export class AppModule { }
