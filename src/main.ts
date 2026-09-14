import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CategoriesService } from './modules/categories/categories.service';

async function bootstrap() {
  console.log('[SplitEZ] Starting bootstrap...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const prefix = process.env.API_PREFIX ?? 'api/v1';
  app.setGlobalPrefix(prefix);
  // Allow CDN-hosted scripts (Chart.js) for the admin panel while keeping
  // Helmet's other protections.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.enableCors();

  // Static admin panel served at /admin (outside the API prefix).
  app.useStaticAssets(join(__dirname, '..', 'public', 'admin'), {
    prefix: '/admin',
  });
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

  // Seed default categories (non-fatal — don't block startup)
  try {
    const categoriesService = app.get(CategoriesService);
    await categoriesService.seedDefaults();
  } catch (err) {
    console.warn('[SplitEZ] Category seeding failed (non-fatal):', err.message);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`SplitEZ backend running on port ${port} (prefix: /${prefix})`);
}
bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
