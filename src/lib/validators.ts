import { z } from "zod";

export const toolSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z.string().url("URL is invalid").max(2000),
  description: z.string().max(500).optional().nullable(),
  iconUrl: z.string().max(2000).optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  order: z.coerce.number().int().min(0).default(0),
  tagIds: z.array(z.string()).default([]),
});
export type ToolInput = z.infer<typeof toolSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  description: z.string().max(300).optional().nullable(),
  icon: z.string().max(80).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color, e.g. #3b82f6")
    .optional()
    .nullable(),
  order: z.coerce.number().int().min(0).default(0),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
});
export type TagInput = z.infer<typeof tagSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;
