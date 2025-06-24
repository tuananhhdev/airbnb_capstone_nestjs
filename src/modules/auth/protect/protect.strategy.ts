import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ACCESS_TOKEN_SECRET } from 'src/common/constant/app.constant';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class ProtectStrategy extends PassportStrategy(Strategy, 'protect') {
    constructor(private readonly prismaService: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey:
                ACCESS_TOKEN_SECRET || `KHÔNG LẤY ĐƯỢC ACCESS_TOKEN_SECRET Ở ENV`,
        });
    }

    async validate(decode: any) {
        console.log(`🔐 ProtectStrategy :: validate - Decode:`, decode);

        const user = await this.prismaService.users.findUnique({
            where: {
                id: decode.sub,
                isDeleted: false,
            },
            include: {
                Roles: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException(`Không tìm thấy người dùng với ID: ${decode.sub}`);
        }

        console.log(`✅ ProtectStrategy :: User found:`, { id: user.id, roleId: user.roleId, fullName: user.fullName });

        return user;
    }
}
