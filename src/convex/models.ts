import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Create a new 3D model/object
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    type: v.string(),
    transform: v.optional(v.object({
      position: v.array(v.number()),
      rotation: v.array(v.number()),
      scale: v.array(v.number()),
    })),
    geometry: v.optional(v.object({
      type: v.string(),
      parameters: v.record(v.string(), v.any()),
    })),
    parentId: v.optional(v.id("models")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .unique();

    if (!membership || membership.role === "viewer") {
      throw new Error("Insufficient permissions");
    }

    const now = Date.now();
    const modelId = await ctx.db.insert("models", {
      projectId: args.projectId,
      name: args.name,
      type: args.type,
      transform: args.transform || {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      geometry: args.geometry,
      parentId: args.parentId,
      visible: true,
      locked: false,
      createdBy: user._id,
      lastModified: now,
      lastModifiedBy: user._id,
    });

    // Update project last modified
    await ctx.db.patch(args.projectId, {
      lastModified: now,
      lastModifiedBy: user._id,
    });

    return modelId;
  },
});

// Update model transform
export const updateTransform = mutation({
  args: {
    id: v.id("models"),
    transform: v.object({
      position: v.array(v.number()),
      rotation: v.array(v.number()),
      scale: v.array(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const model = await ctx.db.get(args.id);
    if (!model) {
      throw new Error("Model not found");
    }

    const project = await ctx.db.get(model.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .unique();

    if (!membership || membership.role === "viewer") {
      throw new Error("Insufficient permissions");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      transform: args.transform,
      lastModified: now,
      lastModifiedBy: user._id,
    });

    // Update project last modified
    await ctx.db.patch(model.projectId, {
      lastModified: now,
      lastModifiedBy: user._id,
    });
  },
});

// Delete model
export const remove = mutation({
  args: { id: v.id("models") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const model = await ctx.db.get(args.id);
    if (!model) {
      throw new Error("Model not found");
    }

    const project = await ctx.db.get(model.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .unique();

    if (!membership || membership.role === "viewer") {
      throw new Error("Insufficient permissions");
    }

    await ctx.db.delete(args.id);

    // Update project last modified
    await ctx.db.patch(model.projectId, {
      lastModified: Date.now(),
      lastModifiedBy: user._id,
    });
  },
});
