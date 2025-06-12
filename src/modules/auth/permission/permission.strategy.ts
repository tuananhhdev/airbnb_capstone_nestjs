import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class PermissionStrategy extends PassportStrategy(Strategy, 'permission') {
    constructor(private readonly prismaService: PrismaService) {
        super();
    }

    async validate(req: any) {
        console.log(`PermissionStrategy :: validate`);
        const user = req.user;
        const roleId = user.roleId;

        // nếu là admin thì cho pass qua
        if (roleId === 1) return true;

        const endpoint = req?._parsedUrl?.pathname;
        const method = req?.method

        const isPermission = await this.prismaService.rolePermission.findFirst({
            where: {
                roleId: roleId,
                Roles: { isActive: true },
                Permissions: { endpoint: endpoint, method: method, isDeleted: false },
                isActive: true,
            },
        });

        if (isPermission === null) {
            throw new BadRequestException(`Không có quyền truy cập với endpoint này`);
        }

        return true;
    }
}
