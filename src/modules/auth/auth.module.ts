import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenModule } from './token/token.module';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
    imports: [TokenModule],
    controllers: [AuthController],
    providers: [AuthService, PrismaService, JwtService],
})
export class AuthModule { }
