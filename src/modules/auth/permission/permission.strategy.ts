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
        const user = req.user;
        console.log('🔑 PermissionStrategy :: validate - req.user:', user ? { id: user.id, roleId: user.roleId } : null);

        if (!user) throw new BadRequestException('Không tìm thấy thông tin người dùng');

        const { roleId } = user;
        const endpoint = req?._parsedUrl?.pathname;
        const method = req?.method;

        // Admin bypass tất cả
        if (roleId === 1) {
            console.log('✅ PermissionStrategy :: Admin bypass - returning user');
            return user;
        }

        // Kiểm tra @RequirePermission decorator
        const requiredPermissions = req.requiredPermissions;
        if (requiredPermissions?.length > 0) {
            await this.checkSpecificPermissions(roleId, requiredPermissions);
            console.log('✅ PermissionStrategy :: Specific permissions passed - returning user');
            return user;
        }

        // Fallback: kiểm tra endpoint pattern
        const rolePermissions = await this.prismaService.rolePermission.findMany({
            where: {
                roleId,
                Roles: { isActive: true },
                Permissions: { method, isDeleted: false },
                isActive: true,
            },
            include: { Permissions: true }
        });

        const hasPermission = rolePermissions.some(rp => {
            const { endpoint: permEndpoint } = rp.Permissions;
            return permEndpoint === endpoint ||
                this.matchPattern(permEndpoint, endpoint);
        });

        if (!hasPermission) {
            throw new BadRequestException('Bạn không có quyền thực hiện hành động này. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
        }

        console.log('✅ PermissionStrategy :: Endpoint permissions passed - returning user');
        return user;
    }

    private async checkSpecificPermissions(roleId: number, requiredPermissions: string[]): Promise<void> {
        const count = await this.prismaService.rolePermission.count({
            where: {
                roleId,
                isActive: true,
                Permissions: { name: { in: requiredPermissions }, isDeleted: false }
            }
        });

        if (count === 0) {
            throw new BadRequestException(this.getPermissionMessage(requiredPermissions));
        }
    }

    private getPermissionMessage(permissions: string[]): string {
        const permissionMap = {
            // Room management
            'host_delete_room': 'Bạn không có quyền xóa phòng. Chỉ chủ nhà và quản trị viên mới có thể thực hiện hành động này.',
            'host_create_room': 'Bạn không có quyền tạo phòng. Chỉ chủ nhà và quản trị viên mới có thể thực hiện hành động này.',
            'host_update_room': 'Bạn không có quyền cập nhật phòng. Chỉ chủ nhà và quản trị viên mới có thể thực hiện hành động này.',
            'host_upload_images': 'Bạn không có quyền tải ảnh phòng. Chỉ chủ nhà và quản trị viên mới có thể thực hiện hành động này.',

            // Admin functions
            'admin_manage_users': 'Bạn không có quyền quản lý người dùng. Chỉ quản trị viên mới có thể thực hiện hành động này.',
            'admin_view_all_bookings': 'Bạn không có quyền xem tất cả đặt phòng. Chỉ quản trị viên mới có thể thực hiện hành động này.',
            'admin_delete_comment': 'Bạn không có quyền xóa bình luận. Chỉ quản trị viên mới có thể thực hiện hành động này.',
            'admin_manage_locations': 'Bạn không có quyền quản lý địa điểm. Chỉ quản trị viên mới có thể thực hiện hành động này.',

            // Generic permissions
            'view_private_data': 'Bạn không có quyền xem thông tin này.',
            'modify_system_settings': 'Bạn không có quyền thay đổi cài đặt hệ thống.'
        };

        // Lấy message đầu tiên tìm thấy
        for (const permission of permissions) {
            if (permissionMap[permission]) {
                return permissionMap[permission];
            }
        }

        // Fallback message
        return 'Bạn không có quyền thực hiện hành động này. Vui lòng liên hệ quản trị viên để được hỗ trợ.';
    }

    private matchPattern(permEndpoint: string, requestEndpoint: string): boolean {
        if (permEndpoint.includes('*')) {
            const pattern = permEndpoint.replace(/\*/g, '[^/]+');
            return new RegExp(`^${pattern}$`).test(requestEndpoint);
        }
        if (permEndpoint.includes(':id')) {
            const pattern = permEndpoint.replace(/:id/g, '[^/]+');
            return new RegExp(`^${pattern}$`).test(requestEndpoint);
        }
        return false;
    }
}
