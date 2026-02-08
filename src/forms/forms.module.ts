import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { ResponsesController } from './responses/responses.controller';
import { ResponsesService } from './responses/responses.service';

import { FieldsController } from './fields/fields.controller';
import { FieldsService } from './fields/fields.service';

@Module({
  imports: [PrismaModule],
  controllers: [FormsController, FieldsController, ResponsesController],
  providers: [FormsService, FieldsService, ResponsesService],
})
export class FormsModule {}
