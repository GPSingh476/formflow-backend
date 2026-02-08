import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1/forms')
@UseGuards(JwtAuthGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateFormDto) {
    return this.formsService.create(req.user.sub, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.formsService.list(req.user.sub);
  }

  // ✅ Phase 3C: Builder fetches one form (owner-only)
  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.formsService.getOne(req.user.sub, id);
  }

  // ✅ Delete a form completely (owner-only)
  @Delete(':id')
  deleteOne(@Param('id') id: string, @Req() req: any) {
    return this.formsService.deleteOne(req.user.sub, id);
  }

  // (Optional) ✅ Phase 4: Publish (safe to add now)
  @Post(':id/publish')
  publish(@Param('id') id: string, @Req() req: any) {
    return this.formsService.publish(req.user.sub, id);
  }
}
