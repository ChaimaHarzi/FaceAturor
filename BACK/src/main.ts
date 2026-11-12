import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { MongoExceptionFilter } from './common/mongo-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  const origins = config
    .get<string>('CORS_ORIGINS', frontendUrl)
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: origins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips fields that are not in the DTO (no mass assignment)
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new MongoExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle('Faceatutor API')
    .setDescription('E-learning platform connecting parents with expert tutors')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = config.get<number>('PORT', 8000);
  await app.listen(port);
  Logger.log(`API ready on http://localhost:${port} (docs: /docs)`, 'Bootstrap');
}
bootstrap();
