import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Req } from '@nestjs/common';
import { type Request } from 'express';
import { ConvexService } from '../convex/convex.service';
import { SavePublicKeyDto } from './dto/save-public-key.dto';
import { SetUsernameDto } from './dto/set-username.dto';
import { ConvexError } from 'convex/values';

@Controller('users')
export class UsersController {
  constructor(private readonly convexService: ConvexService) {}

  @Post('public-key')
  async savePublicKey(@Req() req: Request, @Body() body: SavePublicKeyDto) {
    const clerkUserId = (req as any).userId; // set by ClerkAuthGuard

    await this.convexService.savePublicKey(clerkUserId, body.publicKey);

    return { success: true };
  }

  @Post('username')
  async setUsername(@Req() req: Request, @Body() body: SetUsernameDto) {
    const clerkUserId = (req as any).userId;

    try {
      await this.convexService.setUsername(clerkUserId, body.username);
      return { success: true };
    } catch (err) {
      if (err instanceof ConvexError) {
        throw new BadRequestException(err.data ?? 'Username is already taken');
      }
      throw err;
    }
  }

  @Get(':username/public-key')
  async getPublicKey(@Param('username') username: string) {
    const result = await this.convexService.getPublicKeyByUsername(username);

    if (!result) {
      throw new NotFoundException('User not found or has no public key');
    }

    return result;
  }
}