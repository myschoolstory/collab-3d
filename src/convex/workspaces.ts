import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Create a new workspace
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be authenticated to create workspace");
    }

    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      description: args.description,
      ownerId: user._id,
      isPublic: args.isPublic ?? false,
    });

    // Add creator as owner
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId: user._id,
      role: "owner",
      joinedAt: Date.now(),
    });

    return workspaceId;
  },
});

// Get user's workspaces
export const getUserWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await ctx.db.get(membership.workspaceId);
        return workspace ? { ...workspace, role: membership.role } : null;
      })
    );

    return workspaces.filter(Boolean);
  },
});

// Get workspace by ID with user's role
export const getById = query({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const workspace = await ctx.db.get(args.id);
    if (!workspace) {
      return null;
    }

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", args.id).eq("userId", user._id)
      )
      .unique();

    if (!membership && !workspace.isPublic) {
      return null;
    }

    return {
      ...workspace,
      role: membership?.role || "viewer",
    };
  },
});

// Get workspace members
export const getMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Check if user has access to workspace
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .unique();

    if (!membership) {
      return [];
    }

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const memberUser = await ctx.db.get(member.userId);
        return memberUser ? { ...member, user: memberUser } : null;
      })
    );

    return membersWithUsers.filter(Boolean);
  },
});

// Update workspace
export const update = mutation({
  args: {
    id: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", args.id).eq("userId", user._id)
      )
      .unique();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Insufficient permissions");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.id, updates);
  },
});
