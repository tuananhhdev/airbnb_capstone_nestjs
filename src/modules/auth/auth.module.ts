import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenModule } from './token/token.module';
import { AuthController } from './auth.controller';

@Module({
    imports: [TokenModule],
    controllers: [AuthController],
    providers: [AuthService, PrismaService],
})
export class AuthModule { }
