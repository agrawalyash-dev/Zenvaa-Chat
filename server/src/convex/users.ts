import { mutation, query } from '../convex/_generated/server';
import { ConvexError, v } from 'convex/values';

export const savePublicKey = mutation({
  args: {
    clerkUserId: v.string(),
    publicKey: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) => q.eq('clerkUserId', args.clerkUserId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { publicKey: args.publicKey });
    } else {
      await ctx.db.insert('users', {
        clerkUserId: args.clerkUserId,
        publicKey: args.publicKey,
      });
    }
  },
});

export const setUsername = mutation({
  args: {
    clerkUserId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if username is already taken by someone else
    const existingWithUsername = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .unique();

    if (existingWithUsername && existingWithUsername.clerkUserId !== args.clerkUserId) {
      throw new ConvexError('Username is already taken');
    }

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) => q.eq('clerkUserId', args.clerkUserId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, { username: args.username });
    } else {
      await ctx.db.insert('users', {
        clerkUserId: args.clerkUserId,
        username: args.username,
      });
    }
  },
});

export const getPublicKeyByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .unique();

    if (!user || !user.publicKey) {
      return null;
    }

    return { publicKey: user.publicKey };
  },
});