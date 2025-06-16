import {
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public.decorator';

@Injectable()
export class ProtectGuard extends AuthGuard('protect') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // console.log(`ProtectGuard :: canActivate`);
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        console.log('Request headers in canActivate:', request.headers);
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        console.log({ err, user, info });

        if (err || !user) {
            if (info instanceof TokenExpiredError) {
                throw new ForbiddenException(info.message);
            }
            if (info instanceof JsonWebTokenError) {
                throw new UnauthorizedException(info.message);
            }
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
