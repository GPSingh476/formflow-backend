import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResponsesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(formId: string, userId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, ownerId: true },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== userId)
      throw new ForbiddenException('You do not own this form');

    return form;
  }

  async listResponses(params: {
    formId: string;
    userId: string;
    page: number;
    limit: number;
  }) {
    const { formId, userId, page, limit } = params;

    await this.assertOwner(formId, userId);

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, items] = await Promise.all([
      this.prisma.formResponse.count({ where: { formId } }),
      this.prisma.formResponse.findMany({
        where: { formId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        select: {
          id: true,
          formId: true,
          createdAt: true,
          // quick summary: how many answers submitted in this response
          _count: { select: { answers: true } },
        },
      }),
    ]);

    return {
      page: safePage,
      limit: safeLimit,
      total,
      items: items.map((r) => ({
        id: r.id,
        formId: r.formId,
        createdAt: r.createdAt,
        answersCount: r._count.answers,
      })),
    };
  }

  async getResponseDetail(params: {
    formId: string;
    responseId: string;
    userId: string;
  }) {
    const { formId, responseId, userId } = params;

    await this.assertOwner(formId, userId);

    const response = await this.prisma.formResponse.findFirst({
      where: { id: responseId, formId },
      select: {
        id: true,
        formId: true,
        createdAt: true,
        answers: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            fieldId: true,
            value: true,
            field: {
              select: {
                id: true,
                label: true,
                type: true,
                required: true,
                order: true,
              },
            },
          },
        },
      },
    });

    if (!response) throw new NotFoundException('Response not found');

    // sort answers by field order for nicer UI
    const answers = [...response.answers].sort(
      (a, b) => (a.field.order ?? 0) - (b.field.order ?? 0),
    );

    return {
      id: response.id,
      formId: response.formId,
      createdAt: response.createdAt,
      answers: answers.map((a) => ({
        id: a.id,
        fieldId: a.fieldId,
        value: a.value,
        field: a.field,
      })),
    };
  }
}
