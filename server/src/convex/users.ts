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
      .withIndex('by_clerk_user_id', (q) =>
        q.eq('clerkUserId', args.clerkUserId),
      )
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
    // Normalize to lowercase so uniqueness AND search both behave consistently,
    // regardless of the case the user typed at signup.
    const normalizedUsername = args.username.trim().toLowerCase();

    const existingWithUsername = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalizedUsername))
      .unique();

    if (
      existingWithUsername &&
      existingWithUsername.clerkUserId !== args.clerkUserId
    ) {
      throw new ConvexError('Username is already taken');
    }

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) =>
        q.eq('clerkUserId', args.clerkUserId),
      )
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, { username: normalizedUsername });
    } else {
      await ctx.db.insert('users', {
        clerkUserId: args.clerkUserId,
        username: normalizedUsername,
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
      .withIndex('by_username', (q) =>
        q.eq('username', args.username.toLowerCase()),
      )
      .unique();

    if (!user || !user.publicKey) {
      return null;
    }

    return { publicKey: user.publicKey };
  },
});

export const searchUsers = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const term = args.searchTerm.trim().toLowerCase();
    if (!term) {
      return [];
    }

    const results = await ctx.db
      .query('users')
      .withIndex('by_username', (q) =>
        q.gte('username', term).lt('username', term + '\uffff'),
      )
      .take(10);

    return results
      .filter((u) => u.username)
      .map((u) => ({ username: u.username as string }));
  },
});

export const getMe = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) =>
        q.eq('clerkUserId', args.clerkUserId),
      )
      .unique();

    if (!user) {
      return null;
    }

    return { username: user.username ?? null, hasPublicKey: !!user.publicKey };
  },
});
