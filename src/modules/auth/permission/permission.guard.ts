import {
    BadRequestException,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public.decorator';
import { IS_SKIP_PERMISSION } from 'src/common/decorator/skip-permission.decorator';
import { REQUIRE_PERMISSION_KEY } from 'src/common/decorator/require-permission.decorator';

@Injectable()
export class PermissionGuard extends AuthGuard('permission') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const isSkipPermission = this.reflector.getAllAndOverride<boolean>(IS_SKIP_PERMISSION, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isSkipPermission) return true;

        // Set required permissions vào request
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRE_PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (requiredPermissions?.length > 0) {
            request.requiredPermissions = requiredPermissions;
        }

        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        console.log('🔒 PermissionGuard :: handleRequest:', {
            err: err?.message,
            user: user ? { id: user.id, roleId: user.roleId } : null,
            info: info?.message
        });

        if (err || !user) {
            throw err || new BadRequestException(info?.message || 'Không có quyền truy cập');
        }
        return user;
    }
}