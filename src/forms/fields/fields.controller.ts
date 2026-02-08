import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from '../dto/create-field.dto';
import { UpdateFieldDto } from '../dto/update-field.dto';
import { ReorderFieldsDto } from '../dto/reorder-fields.dto';

@Controller('v1/forms/:formId/fields')
@UseGuards(JwtAuthGuard)
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  list(@Param('formId') formId: string, @Req() req: any) {
    return this.fieldsService.list(formId, req.user.sub);
  }

  @Post()
  create(
    @Param('formId') formId: string,
    @Req() req: any,
    @Body() dto: CreateFieldDto,
  ) {
    return this.fieldsService.create(formId, req.user.sub, dto);
  }

  @Patch(':fieldId')
  update(
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
    @Req() req: any,
    @Body() dto: UpdateFieldDto,
  ) {
    return this.fieldsService.update(formId, fieldId, req.user.sub, dto);
  }

  @Delete(':fieldId')
  remove(
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
    @Req() req: any,
  ) {
    return this.fieldsService.remove(formId, fieldId, req.user.sub);
  }

  // ✅ Phase 3C: reorder fields safely
  @Post('reorder')
  reorder(
    @Param('formId') formId: string,
    @Req() req: any,
    @Body() dto: ReorderFieldsDto,
  ) {
    return this.fieldsService.reorder(formId, req.user.sub, dto.orderedIds);
  }
}
