import {
    BadRequestException,
    ExecutionContext,
    Injectable
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public.decorator';
import { IS_SKIP_PERMISSION } from 'src/common/decorator/skip-permission.decorator';

@Injectable()
export class PermissionGuard extends AuthGuard('permission') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        console.log(`PermissiontGuard :: canActivate`);
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const isSkipPermission = this.reflector.getAllAndOverride<boolean>(IS_SKIP_PERMISSION, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isSkipPermission) {
            return true;
        }
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        console.log({ err, user, info });

        if (err || !user) {
            throw err || new BadRequestException(info.message);
        }
        return user;
    }
}
