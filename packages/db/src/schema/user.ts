import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { companies } from "./company";

export const userRoleEnum = pgEnum("user_role", [
  "superAdmin",
  "admin",
  "user",
]);

// Export the enum to register it with the database
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);

export const users = pgTable(
  "user",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    userName: varchar("user_name", { length: 255 }).unique().notNull(),
    isSuperAdmin: boolean("is_super_admin").notNull().default(false),
    email: varchar("email", { length: 255 }).unique().notNull(),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    role: userRoleEnum("role").notNull().default("user"),
    dateCreated: timestamp("date_created", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    lastActivity: timestamp("last_activity", { withTimezone: true }),
    isLoggedIn: boolean("is_logged_in").notNull().default(false),
    modifiedBy: varchar("modified_by", { length: 255 }),
    status: userStatusEnum("status").default("active"),
    passwordHistory: jsonb("password_history").$type<string[]>().default([]),
  },
  (table) => ({
    // Single column indexes
    emailIdx: index("user_email_idx").on(table.email),
    userNameIdx: index("user_username_idx").on(table.userName),
    roleIdx: index("user_role_idx").on(table.role),
    statusIdx: index("user_status_idx").on(table.status),
    companyIdIdx: index("user_company_id_idx").on(table.companyId),
    dateCreatedIdx: index("user_date_created_idx").on(table.dateCreated),
    lastLoginIdx: index("user_last_login_idx").on(table.lastLogin),
    isSuperAdminIdx: index("user_super_admin_idx").on(table.isSuperAdmin),
    isLoggedInIdx: index("user_is_logged_in_idx").on(table.isLoggedIn),
    lastActivityIdx: index("user_last_activity_idx").on(table.lastActivity),

    // Composite indexes for common query patterns
    companyRoleIdx: index("user_company_role_idx").on(
      table.companyId,
      table.role,
    ),
    companyStatusIdx: index("user_company_status_idx").on(
      table.companyId,
      table.status,
    ),
    roleStatusIdx: index("user_role_status_idx").on(table.role, table.status),
    dateRoleIdx: index("user_date_role_idx").on(table.dateCreated, table.role),

    // Partial indexes for active users (most common query)
    activeUsersIdx: index("user_active_idx")
      .on(table.companyId, table.role, table.dateCreated)
      .where(sql`${table.status} = 'active'`),

    // Index for super admins
    superAdminsIdx: index("user_super_admins_idx")
      .on(table.dateCreated, table.email)
      .where(sql`${table.isSuperAdmin} = true`),
  }),
);

// frontend schema validation
// Base validation schema for creating a admin
export const createAdminSchema = z
  .object({
    userName: z
      .string()
      .min(2, "Username is required")
      .refine((val) => !val.includes(" "), "Username cannot contain spaces"),
    email: z.string().email("Valid email is required"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z
      .string()
      .min(12, "Password must be at least 12 characters"),
    role: z.literal("admin"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createUserSchemaFrontend = z.object({
  userName: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  email: z
    .string({ message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(12, { message: "Password must be at least 12 characters" })
    .max(20, { message: "Password must be less than 20 characters" })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must include at least one uppercase letter",
    })
    .regex(/^(?=.*[a-z])/, {
      message: "Password must include at least one lowercase letter",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must include at least one number",
    })
    .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
      message:
        "Password must include at least one special character (!@#$%^&*()_+-=[]{}\\|;:'\",.<>/?)",
    }),
});

export const updatePasswordSchemaFrontend = z
  .object({
    password: z
      .string()
      .min(12, { message: "Password must be within 12-20 characters" })
      .max(20, { message: "Password must be within 12-20 characters" })
      .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
        message:
          "Password must include at least one uppercase letter, one number, and one special character",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// backend schema validation
// Base validation schema for creating a user
export const createUserSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(12, { message: "Password must be between 12-20 characters" })
      .max(20, { message: "Password must be between 12-20 characters" })
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]).+$/,
        {
          message:
            "Password must include at least one uppercase letter, one number, and one special character",
        },
      ),
    role: z.enum(["superAdmin", "admin", "user"], {
      required_error: "Role is required",
      invalid_type_error: "Invalid role selected",
    }),
    companyId: z.string().optional(),
    userName: z.string().optional(),
    modifiedBy: z.string().optional(),
    reportIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      if (data.role === "superAdmin" || data.role === "admin") return true;
      return !!data.companyId;
    },
    {
      message: "Company ID is required for user roles",
      path: ["companyId"],
    },
  );

// Base validation schema for updating a user
export const updateUserSchema = z
  .object({
    userId: z.string().uuid(),
    modifiedBy: z.string().uuid(),
    role: z.enum(["user", "admin", "superAdmin"]),
    status: z.enum(["active", "inactive"]).optional(),
    prevStatus: z.enum(["active", "inactive"]).optional(),
    companyId: z.string().uuid().nullable().optional(),
    prevCompanyId: z.string().uuid().nullable().optional(),
    userName: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // Only require company IDs for regular users
      if (data.role === "user") {
        if (data.companyId) {
          return !!data.prevCompanyId;
        }
        return true;
      }
      return true;
    },
    {
      message:
        "When updating company for a regular user, both new and previous company IDs must be provided",
      path: ["prevCompanyId"],
    },
  );

export const authRouterSchema = {
  createUser: createUserSchema,
  signIn: z.object({
    email: z
      .string({ message: "Email is required" })
      .email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(12, { message: "Password must be between 12-20 characters" })
      .max(20, { message: "Password must be between 12-20 characters" })
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]).+$/,
        {
          message:
            "Password must include at least one uppercase letter, one number, and one special character",
        },
      ),
    isLoggedIn: z.boolean().default(true),
    isRemembered: z.boolean().default(false).optional(),
  }),
  updateProfile: z.object({
    userName: z.string().optional(),
    email: z.string().email({ message: "Invalid email address" }),
    companyId: z.string().optional(),
    modifiedBy: z.string().optional(),
    reportIds: z.array(z.string().uuid()).optional(),
  }),
  sendOTP: z.object({
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Invalid email address" }),
  }),
  verifyOTP: z.object({
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Invalid email address" }),
    token: z.string().length(6),
  }),
  verifySigninOTP: z.object({
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(12, { message: "Password must be between 12-20 characters" })
      .max(20, { message: "Password must be between 12-20 characters" })
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]).+$/,
        {
          message:
            "Password must include at least one uppercase letter, one number, and one special character",
        },
      ),
    token: z.string().length(6),
  }),
  updatePassword: z.object({
    password: z
      .string()
      .min(12, { message: "Password must be between 12-20 characters" })
      .max(20, { message: "Password must be between 12-20 characters" })
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]).+$/,
        {
          message:
            "Password must include at least one uppercase letter, one number, and one special character",
        },
      ),
  }),
  resetUserPassword: z.object({
    userId: z.string().uuid(),
    password: z
      .string()
      .min(12, { message: "Password must be within 12-20 characters" })
      .max(20, { message: "Password must be within 12-20 characters" })
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]).+$/,
        {
          message:
            "Password must include at least one uppercase letter, one number, and one special character",
        },
      ),
  }),
  purchaseAdditionalUser: z.object({
    companyId: z.string().uuid(),
  }),
};

export const userRouterSchema = {
  getAllUsers: z
    .object({
      searched: z.string().toLowerCase().optional().default(""),
      limit: z.number().default(10),
      page: z.number().default(1),
      sortBy: z
        .enum(["userName", "dateCreated"])
        .optional()
        .default("dateCreated"),
      status: z.enum(["active", "inactive"]).optional(),
    })
    .optional(),
  getAdminUsers: z
    .object({
      searched: z.string().toLowerCase().optional().default(""),
      limit: z.number().default(10),
      page: z.number().default(1),
      sortBy: z
        .enum(["userName", "dateCreated"])
        .optional()
        .default("dateCreated"),
      status: z.enum(["active", "inactive"]).optional(),
    })
    .optional(),
  getAllGeneralUser: z
    .object({
      searched: z.string().toLowerCase().optional().default(""),
      limit: z.number().default(10),
      page: z.number().default(1),
      sortBy: z
        .enum(["userName", "dateCreated"])
        .optional()
        .default("dateCreated"),
      status: z.enum(["active", "inactive"]).optional(),
    })
    .optional(),
  getUsersByCompanyId: z
    .object({
      companyId: z.string().uuid(),
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1),
      searched: z.string().toLowerCase().optional().default(""),
    })
    .optional(),
  getUsersByAdminId: z
    .object({
      searched: z.string().optional().default(""),
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1),
      sortBy: z
        .enum(["userName", "dateCreated"])
        .optional()
        .default("dateCreated"),
      status: z.enum(["active", "inactive"]).optional(),
    })
    .optional(),
  getUserById: z.object({
    userId: z.string().uuid(),
  }),
  getUsersByReportId: z.object({
    reportId: z.string().uuid(),
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
    searched: z.string().optional().default(""),
  }),
  updateUser: updateUserSchema,
  deleteUser: z.object({
    userId: z.string().uuid(),
    modifiedBy: z.string().uuid(),
    role: z.enum(["user", "admin", "superAdmin"]),
  }),
};

export type CreateAdminFormValues = z.infer<typeof createAdminSchema>;

export interface Admins {
  id: string;
  userName: string;
  email: string;
}

export interface User {
  id: string;
  userName: string;
  email: string;
  status: "active" | "inactive" | null;
  modifiedBy: string | null;
  companyId: string | null;
  role: "user" | "superAdmin" | "admin";
  dateCreated: Date;
  lastLogin: Date | null;
  company: {
    companyName: string;
  } | null;
}

// type for the user with company
export interface CompanyUser {
  id: string;
  userName: string;
  email: string;
  role: "user" | "admin" | "superAdmin";
  status: "active" | "inactive" | null;
  dateCreated: Date;
  lastLogin: Date | null;
  companyId?: string | null;
  modifiedBy: string | null;
  isSuperAdmin: boolean;
  passwordHistory: string[] | null;
  company: {
    companyName: string;
  } | null;
}
