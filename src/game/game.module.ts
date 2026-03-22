import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameAdminService } from './game.admin.service';
import { CodeExecutionService } from './code-execution.service';
import { Level_Entity } from './level.entity';
import { Challenge_Entity } from './challenge.entity';
import { Hint_Entity } from './hint.entity';
import { Progress_Entity } from './progress.entity';
import { Submission_Entity } from './submission.entity';
import { TestCase_Entity } from './test-case.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PLAYER_PACKAGE_NAME } from 'proto/user.pb';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Level_Entity,
      Challenge_Entity,
      Hint_Entity,
      Progress_Entity,
      Submission_Entity,
      TestCase_Entity,
    ]),
    ClientsModule.register([
      {
        name: PLAYER_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: PLAYER_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'proto/user.proto'),
          url: process.env.USER_URL,
          loader: {
                keepCase: true,
                objects: true,
                arrays: true,
          },
        },
      },
    ]),
  ],
  controllers: [GameController],
  providers:   [GameService, GameAdminService, CodeExecutionService],
})
export class GameModule {}