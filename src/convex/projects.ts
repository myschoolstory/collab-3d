import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Create a new 3D project
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be authenticated to create project");
    }

    // Check workspace access
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .unique();

    if (!membership || membership.role === "viewer") {
      throw new Error("Insufficient permissions to create project");
    }

    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      workspaceId: args.workspaceId,
      createdBy: user._id,
      isPublic: args.isPublic ?? false,
      settings: {
        renderSettings: {
          quality: "medium",
          lighting: "studio",
          shadows: true,
        },
        gridSettings: {
          visible: true,
          size: 10,
          divisions: 10,
        },
      },
      lastModified: now,
      lastModifiedBy: user._id,
    });

    // Create default scene objects
    await ctx.db.insert("models", {
      projectId,
      name: "Camera",
      type: "camera",
      transform: {
        position: [0, 5, 10],
        rotation: [-0.3, 0, 0],
        scale: [1, 1, 1],
      },
      visible: true,
      locked: false,
      createdBy: user._id,
      lastModified: now,
      lastModifiedBy: user._id,
    });

    await ctx.db.insert("models", {
      projectId,
      name: "Light",
      type: "light",
      transform: {
        position: [5, 10, 5],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      visible: true,
      locked: false,
      createdBy: user._id,
      lastModified: now,
      lastModifiedBy: user._id,
    });

    return projectId;
  },
});

// Get projects in workspace
export const getByWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Check workspace access
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .unique();

    if (!membership) {
      return [];
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    return projects;
  },
});

// Get project by ID
export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const project = await ctx.db.get(args.id);
    if (!project) {
      return null;
    }

    // Check workspace access
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .unique();

    if (!membership && !project.isPublic) {
      return null;
    }

    return project;
  },
});

// Get models in project
export const getModels = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check access
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .unique();

    if (!membership && !project.isPublic) {
      return [];
    }

    const models = await ctx.db
      .query("models")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return models;
  },
});

// Update project
export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    settings: v.optional(v.object({
      renderSettings: v.optional(v.object({
        quality: v.string(),
        lighting: v.string(),
        shadows: v.boolean(),
      })),
      gridSettings: v.optional(v.object({
        visible: v.boolean(),
        size: v.number(),
        divisions: v.number(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const project = await ctx.db.get(args.id);
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

    const updates: any = {
      lastModified: Date.now(),
      lastModifiedBy: user._id,
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.settings !== undefined) {
      updates.settings = { ...project.settings, ...args.settings };
    }

    await ctx.db.patch(args.id, updates);
  },
});
