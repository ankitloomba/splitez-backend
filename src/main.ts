import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CategoriesService } from './modules/categories/categories.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prefix = process.env.API_PREFIX ?? 'api/v1';
  app.setGlobalPrefix(prefix);
  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('SplitEZ / Splitezy API')
    .setDescription('Expense splitting & tracking backend. Backend is the source of truth for all financial calculations.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document);

  // Seed default categories
  const categoriesService = app.get(CategoriesService);
  await categoriesService.seedDefaults();

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`SplitEZ backend running on port ${port} (prefix: /${prefix})`);
}
bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
