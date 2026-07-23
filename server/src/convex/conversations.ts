import { query } from './_generated/server';
import { v } from 'convex/values';

export const getConversations = query({
  args: {
    myClerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) =>
        q.eq('clerkUserId', args.myClerkUserId),
      )
      .unique();

    if (!me) {
      return [];
    }

    // A user can be stored as either participantOne or participantTwo,
    // so we need two indexed queries and merge the results.
    const [asParticipantOne, asParticipantTwo] = await Promise.all([
      ctx.db
        .query('conversations')
        .withIndex('by_participants', (q) => q.eq('participantOne', me._id))
        .collect(),
      ctx.db
        .query('conversations')
        .withIndex('by_participant_two', (q) => q.eq('participantTwo', me._id))
        .collect(),
    ]);

    const conversations = [...asParticipantOne, ...asParticipantTwo];

    const enriched = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId =
          conversation.participantOne === me._id
            ? conversation.participantTwo
            : conversation.participantOne;

        const otherUser = await ctx.db.get(otherUserId);

        const [lastMessage] = await ctx.db
          .query('messages')
          .withIndex('by_conversation', (q) =>
            q.eq('conversationId', conversation._id),
          )
          .order('desc')
          .take(1);

        return {
          conversationId: conversation._id,
          otherUsername: otherUser?.username ?? null,
          otherPublicKey: otherUser?.publicKey ?? null,
          lastMessage: lastMessage
            ? {
                ciphertext: lastMessage.ciphertext,
                _creationTime: lastMessage._creationTime,
                isMine: lastMessage.senderId === me._id,
              }
            : null,
        };
      }),
    );

    // Most recently active conversations first
    enriched.sort((a, b) => {
      const aTime = a.lastMessage?._creationTime ?? 0;
      const bTime = b.lastMessage?._creationTime ?? 0;
      return bTime - aTime;
    });

    return enriched;
  },
});

export const getConversationWithUser = query({
  args: {
    myClerkUserId: v.string(),
    otherUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) =>
        q.eq('clerkUserId', args.myClerkUserId),
      )
      .unique();

    const other = await ctx.db
      .query('users')
      .withIndex('by_username', (q) =>
        q.eq('username', args.otherUsername.toLowerCase()),
      )
      .unique();

    if (!me || !other) {
      return null;
    }

    const [participantOne, participantTwo] =
      me._id < other._id ? [me._id, other._id] : [other._id, me._id];

    const conversation = await ctx.db
      .query('conversations')
      .withIndex('by_participants', (q) =>
        q
          .eq('participantOne', participantOne)
          .eq('participantTwo', participantTwo),
      )
      .unique();

    return conversation ? { conversationId: conversation._id } : null;
  },
});
