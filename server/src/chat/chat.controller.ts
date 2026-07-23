import {
  Body,
  Controller,
  Post,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { type Request } from 'express';
import { ConvexError } from 'convex/values';
import { ConvexService } from '../convex/convex.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly convexService: ConvexService) {}

  @Post(':username/messages')
  async sendMessage(
    @Req() req: Request,
    @Param('username') recipientUsername: string,
    @Body() body: SendMessageDto,
  ) {
    const senderClerkId = (req as any).userId;

    try {
      const result = await this.convexService.sendMessage(
        senderClerkId,
        recipientUsername,
        body.ciphertext,
      );
      return { success: true, conversationId: result.conversationId };
    } catch (err) {
      if (err instanceof ConvexError) {
        throw new BadRequestException(err.data ?? 'Could not send message');
      }
      throw err;
    }
  }
}
