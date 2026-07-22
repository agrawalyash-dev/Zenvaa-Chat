import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';

export const sendMessage = mutation({
  args: {
    senderClerkId: v.string(),
    recipientUsername: v.string(),
    ciphertext: v.string(),
  },
  handler: async (ctx, args) => {
    const sender = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) => q.eq('clerkUserId', args.senderClerkId))
      .unique();

    if (!sender) {
      throw new ConvexError('Sender not found');
    }

    const recipient = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', args.recipientUsername))
      .unique();

    if (!recipient) {
      throw new ConvexError('Recipient not found');
    }

    if (recipient._id === sender._id) {
      throw new ConvexError('Cannot send a message to yourself');
    }

    // Always store the smaller id first, for a consistent lookup key
    const [participantOne, participantTwo] =
      sender._id < recipient._id
        ? [sender._id, recipient._id]
        : [recipient._id, sender._id];

    let conversation = await ctx.db
      .query('conversations')
      .withIndex('by_participants', (q) =>
        q.eq('participantOne', participantOne).eq('participantTwo', participantTwo),
      )
      .unique();

    if (!conversation) {
      const conversationId = await ctx.db.insert('conversations', {
        participantOne,
        participantTwo,
      });
      conversation = await ctx.db.get(conversationId);
    }

    await ctx.db.insert('messages', {
      conversationId: conversation!._id,
      senderId: sender._id,
      ciphertext: args.ciphertext,
    });

    return { conversationId: conversation!._id };
  },
});