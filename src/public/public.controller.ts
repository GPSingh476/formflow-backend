import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('forms/:slug')
  getPublicForm(@Param('slug') slug: string) {
    return this.publicService.getPublicFormBySlug(slug);
  }

  @Post('forms/:slug/submit')
  submit(@Param('slug') slug: string, @Body() body: any) {
    // body example: { answers: { [fieldId]: "value" } }
    return this.publicService.submitBySlug(slug, body);
  }
}
