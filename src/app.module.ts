import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { TokenModule } from './modules/auth/token/token.module';
import { PrismaService } from './modules/prisma/prisma.service';
import { ProtectStrategy } from './modules/auth/protect/protect.strategy';
import { PermissionStrategy } from './modules/auth/permission/permission.strategy';

@Module({
  imports: [AuthModule, TokenModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, ProtectStrategy, PermissionStrategy],
})
export class AppModule {}
