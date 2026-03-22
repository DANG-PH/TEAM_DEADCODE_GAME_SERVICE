import 'dotenv/config' 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { GAME_PACKAGE_NAME } from 'proto/game.pb';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: GAME_PACKAGE_NAME ,
      protoPath: join(process.cwd(), 'proto/game.proto'), 
      url: process.env.GAME_URL, 
      loader: {
        keepCase: true,
        objects: true,
        arrays: true,
      },
    },
  });

  await app.startAllMicroservices();
  logger.log(`gRPC server running on ${process.env.GAME_URL}`);

  await app.listen(Number(process.env.PORT));
}

bootstrap();
