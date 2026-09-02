import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** Send a notification to a user (creates DB record + sends push). */
  async send(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, title, body, type, data: (data ?? {}) as any },
    });

    // Fire push notification in background (don't await to avoid slowing the request)
    const pushData: Record<string, string> = {
      type,
      notificationId: notification.id,
    };
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string') pushData[k] = v;
        else pushData[k] = JSON.stringify(v);
      }
    }
    this.push.sendToUser(userId, title, body, pushData).catch(() => {});

    return notification;
  }

  /** Send a notification to multiple users. */
  async sendToMany(
    userIds: string[],
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ) {
    await Promise.allSettled(
      userIds.map((id) => this.send(id, title, body, type, data)),
    );
  }

  /** List notifications for the current user. */
  async list(userId: string, cursor?: string, limit = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;

    return {
      items: items.map((n) => this.present(n)),
      nextCursor: hasMore ? items[items.length - 1].id : null,
      unreadCount: await this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    };
  }

  /** Mark a single notification as read. */
  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) throw new NotFoundException();
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { success: true };
  }

  /** Mark all notifications as read. */
  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  /** Register a device token for push notifications. */
  async registerDevice(userId: string, token: string, platform: string) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  /** Remove a device token. */
  async removeDevice(token: string) {
    await this.prisma.deviceToken
      .delete({ where: { token } })
      .catch(() => null);
    return { success: true };
  }

  private present(n: any) {
    return {
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt,
    };
  }
}
