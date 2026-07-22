import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

@Injectable()
export class ConvexService {
  public readonly client: ConvexHttpClient;

  constructor(private configService: ConfigService) {
    const convexUrl = this.configService.get<string>('CONVEX_URL');

    if (!convexUrl) {
      throw new Error('CONVEX_URL is not defined in environment variables');
    }

    this.client = new ConvexHttpClient(convexUrl);
  }

  async savePublicKey(clerkUserId: string, publicKey: string) {
    return this.client.mutation(api.users.savePublicKey, {
      clerkUserId,
      publicKey,
    });
  }

  async setUsername(clerkUserId: string, username: string) {
  return this.client.mutation(api.users.setUsername, {
    clerkUserId,
    username,
  });
}

async getPublicKeyByUsername(username: string) {
  return this.client.query(api.users.getPublicKeyByUsername, {
    username,
  });
}

async sendMessage(senderClerkId: string, recipientUsername: string, ciphertext: string) {
  return this.client.mutation(api.messages.sendMessage, {
    senderClerkId,
    recipientUsername,
    ciphertext,
  });
}
}
