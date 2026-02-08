import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicFormBySlug(slug: string) {
    const form = await this.prisma.form.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        status: true,
        publishedAt: true,
        fields: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            label: true,
            required: true,
            order: true,
            placeholder: true,
            options: true,
          },
        },
      },
    });

    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async submitBySlug(slug: string, body: any) {
    const answersObj = body?.answers;
    if (!answersObj || typeof answersObj !== 'object') {
      throw new BadRequestException('Invalid payload: expected { answers: { [fieldId]: value } }');
    }

    const form = await this.prisma.form.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: {
        id: true,
        fields: {
          select: { id: true, required: true, type: true },
        },
      },
    });

    if (!form) throw new NotFoundException('Form not found');

    // required validation
    for (const f of form.fields) {
      if (!f.required) continue;
      const v = answersObj[f.id];
      const empty =
        v === undefined ||
        v === null ||
        (typeof v === 'string' && v.trim() === '') ||
        (Array.isArray(v) && v.length === 0);
      if (empty) throw new BadRequestException(`Missing required field: ${f.id}`);
    }

    // Create response + answers in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const response = await tx.formResponse.create({
        data: { formId: form.id },
        select: { id: true, createdAt: true },
      });

      const allowedFieldIds = new Set(form.fields.map((f) => f.id));

      const answers = Object.entries(answersObj)
        .filter(([fieldId]) => allowedFieldIds.has(fieldId))
        .map(([fieldId, value]) => ({
          responseId: response.id,
          fieldId,
          value: value === undefined || value === null ? null : String(value),
        }));

      if (answers.length) {
        await tx.formAnswer.createMany({ data: answers });
      }

      return { ok: true, responseId: response.id };
    });

    return result;
  }
}
