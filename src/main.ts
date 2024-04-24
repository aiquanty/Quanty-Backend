import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './httpExceptionFilter';

require('dotenv').config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.PORT;
  await app.listen(port, () => {
    console.log('Listening at http://localhost:' + port + '/' + globalPrefix);
  });
}
bootstrap();
