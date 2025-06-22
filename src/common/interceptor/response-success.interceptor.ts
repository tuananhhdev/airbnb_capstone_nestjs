import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SUCCESS_MESSAGE_KEY } from '../decorator/success-mesage.decorator';

@Injectable()
export class ResponseSuccessInterceptor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const statusCode = res.statusCode;

        const baseUrl = `http://localhost:3069/api-docs`;
        const methodName = context.getHandler().name;
        const controllerName = context.getClass().name;
        const tag = controllerName.replace('Controller', '');
        const docUrl = `${baseUrl}#${tag}/${controllerName}_${methodName}`;

        return next.handle().pipe(
            map((data) => {
                // Ưu tiên lấy message từ data nếu có, sau đó từ decorator, cuối cùng là mặc định
                const message =
                    data?.message ??
                    this.reflector.get<string>(SUCCESS_MESSAGE_KEY, context.getHandler()) ??
                    'Thao tác thành công';

                // Nếu data chứa message, loại bỏ nó khỏi data để tránh trùng lặp
                const { message: _removedMessage, ...responseData } = data || {};

                return {
                    status: 'success',
                    code: statusCode,
                    message,
                    data: responseData,
                    docs: docUrl,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}