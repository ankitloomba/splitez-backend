import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;
  private app: App | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      try {
        this.app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.enabled = true;
        this.logger.log('Firebase Admin initialized');
      } catch (e) {
        this.logger.warn('Firebase Admin init failed — push disabled', e);
      }
    } else {
      this.logger.warn(
        'Firebase credentials not configured — push notifications disabled',
      );
    }
  }

  /**
   * Send a push notification to all devices registered for a user.
   * Automatically cleans up invalid tokens.
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.enabled || !this.app) return;

    const devices = await this.prisma.deviceToken.findMany({
      where: { userId },
    });

    if (devices.length === 0) return;

    const message: MulticastMessage = {
      tokens: devices.map((d) => d.token),
      notification: { title, body },
      data: data ?? {},
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: await this.getUnreadCount(userId),
          },
        },
      },
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'splitez_notifications',
        },
      },
    };

    try {
      const messaging = getMessaging(this.app);
      const response = await messaging.sendEachForMulticast(message);

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (
            resp.error &&
            (resp.error.code === 'messaging/invalid-registration-token' ||
              resp.error.code === 'messaging/registration-token-not-registered')
          ) {
            invalidTokens.push(devices[idx].token);
          }
        });

        if (invalidTokens.length > 0) {
          await this.prisma.deviceToken.deleteMany({
            where: { token: { in: invalidTokens } },
          });
          this.logger.log(`Cleaned ${invalidTokens.length} invalid token(s)`);
        }
      }

      this.logger.debug(
        `Push sent to ${response.successCount}/${devices.length} device(s) for user ${userId}`,
      );
    } catch (e) {
      this.logger.error('Push send failed', e);
    }
  }

  /**
   * Send push to multiple users at once.
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    await Promise.allSettled(
      userIds.map((id) => this.sendToUser(id, title, body, data)),
    );
  }

  private async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
