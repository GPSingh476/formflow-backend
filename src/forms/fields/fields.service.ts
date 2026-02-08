import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFieldDto } from '../dto/create-field.dto';
import { UpdateFieldDto } from '../dto/update-field.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(formId: string, userId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, ownerId: true },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== userId) throw new ForbiddenException('Not your form');
  }

  async list(formId: string, userId: string) {
    await this.assertOwner(formId, userId);

    return this.prisma.formField.findMany({
      where: { formId },
      orderBy: { order: 'asc' },
    });
  }

  async create(formId: string, userId: string, dto: CreateFieldDto) {
    await this.assertOwner(formId, userId);

    // If order not provided, append to end (avoids @@unique([formId, order]) collisions)
    let order = dto.order;
    if (order === undefined || order === null) {
      const last = await this.prisma.formField.findFirst({
        where: { formId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (last?.order ?? -1) + 1;
    }

    try {
      return await this.prisma.formField.create({
        data: {
          formId,
          type: dto.type,
          label: dto.label,
          required: dto.required ?? false,
          order,
          placeholder: dto.placeholder ?? null,
          options: dto.options ?? null,
        },
      });
    } catch (e: any) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Field order already exists for this form');
      }
      throw e;
    }
  }

  // ✅ Phase 3C: PATCH /v1/forms/:formId/fields/:fieldId
  async update(
    formId: string,
    fieldId: string,
    userId: string,
    dto: UpdateFieldDto,
  ) {
    await this.assertOwner(formId, userId);

    const field = await this.prisma.formField.findUnique({
      where: { id: fieldId },
      select: { id: true, formId: true },
    });

    if (!field || field.formId !== formId) {
      throw new NotFoundException('Field not found');
    }

    try {
      return await this.prisma.formField.update({
        where: { id: fieldId },
        data: {
          ...(dto.label !== undefined ? { label: dto.label } : {}),
          ...(dto.required !== undefined ? { required: dto.required } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
          ...(dto.placeholder !== undefined
            ? { placeholder: dto.placeholder }
            : {}),
          ...(dto.options !== undefined ? { options: dto.options } : {}),
        },
      });
    } catch (e: any) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Field order already exists for this form');
      }
      throw e;
    }
  }

  // ✅ Phase 3C: DELETE /v1/forms/:formId/fields/:fieldId
  async remove(formId: string, fieldId: string, userId: string) {
    await this.assertOwner(formId, userId);

    const field = await this.prisma.formField.findUnique({
      where: { id: fieldId },
      select: { id: true, formId: true },
    });

    if (!field || field.formId !== formId) {
      throw new NotFoundException('Field not found');
    }

    await this.prisma.formField.delete({ where: { id: fieldId } });
    return { ok: true };
  }

  // ✅ Phase 3C: Reorder fields safely (handles @@unique([formId, order]))
  // ✅ Phase 3C: Reorder fields safely (works with @@unique([formId, order]))
  async reorder(formId: string, userId: string, orderedIds: string[]) {
    await this.assertOwner(formId, userId);

    const existing = await this.prisma.formField.findMany({
      where: { formId },
      select: { id: true },
    });

    const existingIds = new Set(existing.map((f) => f.id));

    // Validate: every id must belong to the form
    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        throw new NotFoundException('Field id does not belong to this form');
      }
    }

    // Optional: enforce full reorder list (recommended)
    if (orderedIds.length !== existing.length) {
      throw new ConflictException(
        'orderedIds must include all fields for this form',
      );
    }

    // Two-phase update to avoid unique collisions
    await this.prisma.$transaction(async (tx) => {
      // Phase 1: set to temporary unique orders
      await Promise.all(
        orderedIds.map((id, index) =>
          tx.formField.update({
            where: { id },
            data: { order: 10000 + index },
          }),
        ),
      );

      // Phase 2: set to final orders
      await Promise.all(
        orderedIds.map((id, index) =>
          tx.formField.update({
            where: { id },
            data: { order: index },
          }),
        ),
      );
    });

    return this.prisma.formField.findMany({
      where: { formId },
      orderBy: { order: 'asc' },
    });
  }
}
