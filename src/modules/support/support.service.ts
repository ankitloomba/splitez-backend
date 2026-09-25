import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { CreateEnquiryDto } from './support.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async createEnquiry(dto: CreateEnquiryDto, userId?: string) {
    const enquiry = await this.prisma.enquiry.create({
      data: {
        userId: userId ?? null,
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        topic: dto.topic,
        message: dto.message,
        attachments: dto.attachments ?? [],
      },
    });

    await this.sendConfirmationEmail(dto.email, dto.name, dto.topic, enquiry.id);

    return { id: enquiry.id, status: enquiry.status };
  }

  private async sendConfirmationEmail(
    to: string,
    name: string,
    topic: string,
    enquiryId: string,
  ) {
    if (this.email.isMock()) {
      this.logger.debug(`[MOCK EMAIL] Enquiry confirmation → ${to} (id: ${enquiryId})`);
      return;
    }

    try {
      const html = this.confirmationTemplate(name, topic, enquiryId);
      // EmailService doesn't expose a generic send() yet — we access Resend via reflection
      // Use the same resend instance the service owns
      (this.email as any).resend?.emails.send({
        from: (this.email as any).fromAddress,
        to,
        subject: 'We received your message – SplitEZ Support',
        html,
      });
    } catch (err) {
      this.logger.error('Failed to send enquiry confirmation email', err);
    }
  }

  private confirmationTemplate(name: string, topic: string, id: string): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
        <h2 style="margin-bottom: 8px;">We've received your message</h2>
        <p style="color: #555; margin-bottom: 24px;">Hi ${name},</p>
        <p style="color: #555; line-height: 1.6;">
          Thanks for reaching out! We've received your <strong>${topic}</strong> enquiry
          and our support team will get back to you within <strong>24 hours</strong>.
        </p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #777;">
          Reference ID: <strong style="font-family: monospace;">${id.slice(0, 8).toUpperCase()}</strong>
        </div>
        <p style="color: #555; line-height: 1.6;">
          If you have any additional information to share, simply reply to this email.
        </p>
        <p style="color: #555; margin-top: 32px;">— The SplitEZ Team</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">SplitEZ · support@splitez.app</p>
      </div>
    `;
  }

  // Admin
  async listEnquiries(opts: { status?: string; page?: number; pageSize?: number }) {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = opts.status ? { status: opts.status } : {};

    const [items, total] = await Promise.all([
      this.prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.enquiry.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async updateEnquiryStatus(id: string, status: string) {
    return this.prisma.enquiry.update({ where: { id }, data: { status } });
  }
}
