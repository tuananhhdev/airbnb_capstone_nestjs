import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { ResponseSuccessInterceptor } from './common/interceptor/response-success.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { ProtectGuard } from './modules/auth/protect/protect.guard';
import { PermissionGuard } from './modules/auth/permission/permission.guard';
import { PORT } from './common/constant/app.constant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  const reflector = app.get(Reflector)
  app.useGlobalGuards(new ProtectGuard(reflector));
  app.useGlobalGuards(new PermissionGuard(reflector));
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.useGlobalInterceptors(new ResponseSuccessInterceptor())
  app.setGlobalPrefix('api');
  await app.listen(PORT ?? 3000);
}
bootstrap();
