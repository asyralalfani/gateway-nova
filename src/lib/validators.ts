import { z } from "zod";

export const toolSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  url: z.string().url("URL tidak valid").max(2000),
  description: z.string().max(500).optional().nullable(),
  iconUrl: z.string().max(2000).optional().nullable(),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  order: z.coerce.number().int().min(0).default(0),
  tagIds: z.array(z.string()).default([]),
});
export type ToolInput = z.infer<typeof toolSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(80),
  description: z.string().max(300).optional().nullable(),
  icon: z.string().max(80).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format hex color, mis: #3b82f6")
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
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});
export type LoginInput = z.infer<typeof loginSchema>;
