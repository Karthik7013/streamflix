import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

export const signUpSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters."),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

export const requestFormSchema = z.object({
  title: z.string().min(1, "Movie title is required.").max(200),
  description: z.string().max(1000).or(z.literal("")),
  externalLink: z.string().url("Invalid URL.").or(z.literal("")),
})

export const movieFormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  slug: z.string().min(1, "Slug is required."),
  description: z.string().or(z.literal("")),
  videoUrl: z.string().or(z.literal("")),
  thumbnailUrl: z.string().or(z.literal("")),
  backdropUrl: z.string().or(z.literal("")),
  trailerUrl: z.string().or(z.literal("")),
  durationSeconds: z.string().or(z.literal("")),
  releaseDate: z.string().or(z.literal("")),
  tagIds: z.array(z.number()),
  tmdbId: z.number().optional(),
  originalLanguage: z.string().or(z.literal("")),
  published: z.boolean().optional(),
})

export const seriesFormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  slug: z.string().min(1, "Slug is required."),
  description: z.string().or(z.literal("")),
  thumbnailUrl: z.string().or(z.literal("")),
  backdropUrl: z.string().or(z.literal("")),
  trailerUrl: z.string().or(z.literal("")),
  releaseDate: z.string().or(z.literal("")),
  tagIds: z.array(z.number()),
  tmdbId: z.number().optional(),
  originalLanguage: z.string().or(z.literal("")),
  published: z.boolean().optional(),
})

export const deleteAccountSchema = z.object({
  confirmText: z.string(),
})

export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required.").max(50, "Tag name too long."),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type RequestFormData = z.infer<typeof requestFormSchema>
export type MovieFormData = z.infer<typeof movieFormSchema>
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>
export type TagFormData = z.infer<typeof tagSchema>
export type SeriesFormData = z.infer<typeof seriesFormSchema>

export type CreateMovieApiData = z.infer<typeof createMovieApiSchema>
export type UpdateMovieApiData = z.infer<typeof updateMovieApiSchema>
export type CreateSeriesApiData = z.infer<typeof createSeriesApiSchema>
export type UpdateSeriesApiData = z.infer<typeof updateSeriesApiSchema>
export type CreateTagApiData = z.infer<typeof createTagApiSchema>
export type UpdateTagApiData = z.infer<typeof updateTagApiSchema>

export const createMovieApiSchema = z.object({
  title: z.string().min(1, "Title is required."),
  slug: z.string().min(1, "Slug is required."),
  description: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional(),
  backdropUrl: z.string().optional().nullable(),
  trailerUrl: z.string().optional().nullable(),
  durationSeconds: z.number().optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  tagIds: z.array(z.number()).optional(),
  tmdbId: z.number().optional().nullable(),
  originalLanguage: z.string().optional().nullable(),
  published: z.boolean().optional(),
})

export const updateMovieApiSchema = createMovieApiSchema.partial()

export const createSeriesApiSchema = z.object({
  title: z.string().min(1, "Title is required."),
  slug: z.string().min(1, "Slug is required."),
  description: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional(),
  backdropUrl: z.string().optional().nullable(),
  trailerUrl: z.string().optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  tagIds: z.array(z.number()).optional(),
  tmdbId: z.number().optional().nullable(),
  originalLanguage: z.string().optional().nullable(),
  published: z.boolean().optional(),
})

export const updateSeriesApiSchema = createSeriesApiSchema.partial()

export const createTagApiSchema = z.object({
  name: z.string().min(1, "Name is required."),
})

export const updateTagApiSchema = createTagApiSchema.partial()
