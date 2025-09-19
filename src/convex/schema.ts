import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// Workspace member roles
export const WORKSPACE_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

export const workspaceRoleValidator = v.union(
  v.literal(WORKSPACE_ROLES.OWNER),
  v.literal(WORKSPACE_ROLES.ADMIN),
  v.literal(WORKSPACE_ROLES.EDITOR),
  v.literal(WORKSPACE_ROLES.VIEWER),
);
export type WorkspaceRole = Infer<typeof workspaceRoleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Workspaces for multi-tenant organization
    workspaces: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      ownerId: v.id("users"),
      isPublic: v.boolean(),
      settings: v.optional(v.object({
        defaultProjectSettings: v.optional(v.object({
          renderQuality: v.string(),
          autoSave: v.boolean(),
          collaborationMode: v.string(),
        })),
      })),
    }).index("by_owner", ["ownerId"]),

    // Workspace members for collaboration
    workspaceMembers: defineTable({
      workspaceId: v.id("workspaces"),
      userId: v.id("users"),
      role: workspaceRoleValidator,
      invitedBy: v.optional(v.id("users")),
      joinedAt: v.number(),
    })
      .index("by_workspace", ["workspaceId"])
      .index("by_user", ["userId"])
      .index("by_workspace_and_user", ["workspaceId", "userId"]),

    // 3D Projects within workspaces
    projects: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      workspaceId: v.id("workspaces"),
      createdBy: v.id("users"),
      thumbnail: v.optional(v.id("_storage")),
      isPublic: v.boolean(),
      settings: v.object({
        renderSettings: v.object({
          quality: v.string(),
          lighting: v.string(),
          shadows: v.boolean(),
        }),
        gridSettings: v.object({
          visible: v.boolean(),
          size: v.number(),
          divisions: v.number(),
        }),
      }),
      lastModified: v.number(),
      lastModifiedBy: v.id("users"),
    })
      .index("by_workspace", ["workspaceId"])
      .index("by_creator", ["createdBy"])
      .index("by_last_modified", ["lastModified"]),

    // 3D Models/Objects in projects
    models: defineTable({
      projectId: v.id("projects"),
      name: v.string(),
      type: v.string(), // "mesh", "light", "camera", "empty"
      transform: v.object({
        position: v.array(v.number()), // [x, y, z]
        rotation: v.array(v.number()), // [x, y, z] euler angles
        scale: v.array(v.number()), // [x, y, z]
      }),
      geometry: v.optional(v.object({
        type: v.string(), // "box", "sphere", "cylinder", "plane", "custom"
        parameters: v.record(v.string(), v.any()),
        vertices: v.optional(v.array(v.number())),
        faces: v.optional(v.array(v.number())),
        normals: v.optional(v.array(v.number())),
        uvs: v.optional(v.array(v.number())),
      })),
      material: v.optional(v.object({
        type: v.string(), // "standard", "pbr", "basic"
        properties: v.record(v.string(), v.any()),
        textures: v.optional(v.record(v.string(), v.id("_storage"))),
      })),
      parentId: v.optional(v.id("models")), // for hierarchy
      visible: v.boolean(),
      locked: v.boolean(),
      createdBy: v.id("users"),
      lastModified: v.number(),
      lastModifiedBy: v.id("users"),
    })
      .index("by_project", ["projectId"])
      .index("by_parent", ["parentId"])
      .index("by_creator", ["createdBy"]),

    // Materials library for PBR texturing
    materials: defineTable({
      name: v.string(),
      workspaceId: v.id("workspaces"),
      type: v.string(), // "pbr", "standard", "basic"
      properties: v.object({
        baseColor: v.optional(v.array(v.number())), // [r, g, b, a]
        metallic: v.optional(v.number()),
        roughness: v.optional(v.number()),
        normal: v.optional(v.number()),
        emission: v.optional(v.array(v.number())),
        transparency: v.optional(v.number()),
      }),
      textures: v.record(v.string(), v.id("_storage")), // albedo, normal, roughness, metallic, etc.
      createdBy: v.id("users"),
      isPublic: v.boolean(),
    })
      .index("by_workspace", ["workspaceId"])
      .index("by_creator", ["createdBy"]),

    // Real-time collaboration sessions
    collaborationSessions: defineTable({
      projectId: v.id("projects"),
      userId: v.id("users"),
      cursor: v.optional(v.object({
        position: v.array(v.number()),
        target: v.optional(v.string()), // selected object id
      })),
      isActive: v.boolean(),
      lastSeen: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_user", ["userId"])
      .index("by_project_and_user", ["projectId", "userId"]),

    // Version history for projects
    projectVersions: defineTable({
      projectId: v.id("projects"),
      versionNumber: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      data: v.string(), // JSON serialized project data
      createdBy: v.id("users"),
      thumbnail: v.optional(v.id("_storage")),
    })
      .index("by_project", ["projectId"])
      .index("by_project_and_version", ["projectId", "versionNumber"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;