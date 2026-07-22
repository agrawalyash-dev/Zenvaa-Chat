import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    username: v.optional(v.string()),
    publicKey: v.optional(v.string()),
  })
    .index('by_clerk_user_id', ['clerkUserId'])
    .index('by_username', ['username']),

  conversations: defineTable({
    participantOne: v.id('users'), // always the smaller _id, for consistent lookup
    participantTwo: v.id('users'),
  }).index('by_participants', ['participantOne', 'participantTwo']),

  messages: defineTable({
    conversationId: v.id('conversations'),
    senderId: v.id('users'),
    ciphertext: v.string(),
  }).index('by_conversation', ['conversationId']),
});