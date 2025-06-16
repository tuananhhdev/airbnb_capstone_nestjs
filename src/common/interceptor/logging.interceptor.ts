import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const color = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    fg: {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
    },
};

const methodColor = (method: string) => {
    switch (method.toUpperCase()) {
        case 'GET':
            return color.fg.green;
        case 'POST':
            return color.fg.blue;
        case 'PUT':
            return color.fg.yellow;
        case 'DELETE':
            return color.fg.red;
        case 'PATCH':
            return color.fg.magenta;
        default:
            return color.fg.white;
    }
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const url = req.originalUrl || req.url;

        const now = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - now;

                const log = [
                    '⚡',
                    methodColor(method),
                    method,
                    color.fg.gray,
                    url,
                    color.fg.cyan,
                    `${duration}ms`,
                    color.reset,
                ].join(' ');

                console.log(log);
            }),
        );
    }
}
