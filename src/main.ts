import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './common/constant/app.constant';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProtectGuard } from './modules/auth/protect/protect.guard';
import { PermissionGuard } from './modules/auth/permission/permission.guard';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { ResponseSuccessInterceptor } from './common/interceptor/response-success.interceptor';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // GLOBAL
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new ProtectGuard(reflector));
  app.useGlobalGuards(new PermissionGuard(reflector));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new ResponseSuccessInterceptor(reflector));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Airbnb Capstone API')
    .setDescription('API documentation for Airbnb Capstone project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false
  });

  // Loại bỏ route /api nếu xuất hiện
  if (document.paths['/api']) {
    delete document.paths['/api'];
  }

  const customCssPath = path.join(__dirname, '..', 'src', 'common', 'assets', 'css', 'custom-swagger.css'); // Cập nhật đường dẫn CSS
  const customJsPath = path.join(__dirname, '..', 'src', 'common', 'assets', 'js', 'custom-swagger.js'); // Cập nhật đường dẫn JS
  const customCss = fs.readFileSync(customCssPath, 'utf8');
  const customJs = fs.readFileSync(customJsPath, 'utf8');

  SwaggerModule.setup('/api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      displayOperationId: false,
      tryItOutEnabled: true,
    },
    customSiteTitle: '🏠 Airbnb Capstone API - Professional Documentation',
    customCss,
    customJs,
  });

  await app.listen(PORT ?? 3069);
}
bootstrap();