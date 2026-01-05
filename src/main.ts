// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* ========== Global Validation ========== */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO’da olmayan alanları kırp
      transform: true, // tip dönüşümleri (query/body)
      forbidNonWhitelisted: true, // DTO’da olmayan alan gelirse 400
    }),
  );

  /* ========== CORS Ayarı (frontend: http://localhost:3001) ========== */
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  /* ========== Swagger ========== */
  const config = new DocumentBuilder()
    .setTitle('Notification Backend API')
    .setDescription('Daily notification + feedback sistemi')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'Authorization',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
bootstrap();
