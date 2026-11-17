import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureNotesApp } from './notes/notes-app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureNotesApp(app);
  const configService = app.get(ConfigService);

  await app.listen(configService.getOrThrow<number>('PORT'));
}

void bootstrap();
