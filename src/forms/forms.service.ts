import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFormDto) {
    const base = slugify(dto.title);
    const suffix = Math.random().toString(36).slice(2, 8);
    const slug = `${base}-${suffix}`;

    return this.prisma.form.create({
      data: {
        ownerId: userId,
        title: dto.title,
        description: dto.description,
        slug,
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async list(userId: string) {
    return this.prisma.form.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ✅ Phase 3C: Builder needs a single form details (owner-only)
  async getOne(userId: string, formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== userId) throw new ForbiddenException('Not your form');

    // don’t leak ownerId to frontend
    const { ownerId, ...rest } = form;
    return rest;
  }

  // ✅ Delete a form completely (owner-only)
  async deleteOne(userId: string, formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, ownerId: true },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== userId) throw new ForbiddenException('Not your form');

    // Cascades will delete FormField rows because schema has onDelete: Cascade on FormField.form relation
    await this.prisma.form.delete({ where: { id: formId } });

    return { ok: true };
  }

  // (Optional) ✅ Phase 4: Publish flow (safe to add now)
  async publish(userId: string, formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, ownerId: true, status: true },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== userId) throw new ForbiddenException('Not your form');

    return this.prisma.form.update({
      where: { id: formId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        slug: true,
      },
    });
  }
}
