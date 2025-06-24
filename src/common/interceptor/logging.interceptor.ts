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

    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
    }
};

const methodColor = (method: string) => {
    switch (method.toUpperCase()) {
        case 'GET':
            return { fg: color.fg.green, bg: color.bg.black };
        case 'POST':
            return { fg: color.fg.blue, bg: color.bg.black };
        case 'PUT':
            return { fg: color.fg.yellow, bg: color.bg.black };
        case 'DELETE':
            return { fg: color.fg.red, bg: color.bg.black };
        case 'PATCH':
            return { fg: color.fg.magenta, bg: color.bg.black };
        default:
            return { fg: color.fg.white, bg: color.bg.black };
    }
};

const formatTime = (ms: number): string => {
    if (ms < 10) return `${color.fg.green}${ms}ms${color.reset}`;
    if (ms < 100) return `${color.fg.cyan}${ms}ms${color.reset}`;
    if (ms < 1000) return `${color.fg.yellow}${ms}ms${color.reset}`;
    return `${color.fg.red}${ms}ms${color.reset}`;
};

const formatDate = (): string => {
    const now = new Date();
    return `${color.dim}${now.toISOString().split('T')[1].split('.')[0]}${color.reset}`;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const url = req.originalUrl || req.url;
        const userAgent = req.headers['user-agent'] || '-';
        const ip = req.ip || req.connection.remoteAddress || '-';

        const startTime = Date.now();

        return next.handle().pipe(
            tap((data) => {
                const duration = Date.now() - startTime;
                const { fg, bg } = methodColor(method);

                const statusCode = context.switchToHttp().getResponse().statusCode;
                const statusColor = statusCode >= 400
                    ? color.fg.red
                    : statusCode >= 300
                        ? color.fg.yellow
                        : color.fg.green;

                const log = [
                    `[${formatDate()}]`,
                    `${color.bright}${fg}${bg} ${method.padEnd(7)} ${color.reset}`,
                    `${statusColor}${statusCode}${color.reset}`,
                    `${color.fg.gray}${url}${color.reset}`,
                    formatTime(duration),
                    `${color.dim}(${ip.slice(0, 15)})${color.reset}`
                ].join(' ');

                console.log(log);
            }),
        );
    }
}