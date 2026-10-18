import { z } from "zod"

const slugField = z
  .string()
  .min(1, "Slug is required.")
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens.")

export const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

export const signUpSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters."),
})

export const loginFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
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
  slug: slugField,
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

export const deleteAccountSchema = z.object({
  confirmText: z.string(),
})

export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required.").max(50, "Tag name too long."),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type LoginFormValues = z.infer<typeof loginFormSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type RequestFormData = z.infer<typeof requestFormSchema>
export type MovieFormData = z.infer<typeof movieFormSchema>
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>
export type TagFormData = z.infer<typeof tagSchema>

export type CreateMovieApiData = z.infer<typeof createMovieApiSchema>
export type UpdateMovieApiData = z.infer<typeof updateMovieApiSchema>
export type CreateTagApiData = z.infer<typeof createTagApiSchema>
export type UpdateTagApiData = z.infer<typeof updateTagApiSchema>
export type CreatePersonApiData = z.infer<typeof createPersonApiSchema>
export type UpdatePersonApiData = z.infer<typeof updatePersonApiSchema>
export type BackfillCastApiData = z.infer<typeof backfillCastApiSchema>

export const createMovieApiSchema = z.object({
  title: z.string().min(1, "Title is required."),
  slug: slugField,
  description: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional(),
  backdropUrl: z.string().optional().nullable(),
  trailerUrl: z.string().optional().nullable(),
  durationSeconds: z.number().nonnegative("Invalid duration.").optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  tagIds: z.array(z.number()).optional(),
  tmdbId: z.number().optional().nullable(),
  originalLanguage: z.string().optional().nullable(),
  published: z.boolean().optional(),
})

export const updateMovieApiSchema = createMovieApiSchema.partial()

export const createTagApiSchema = z.object({
  name: z.string().min(1, "Name is required."),
  imageUrl: z.string().url("Invalid URL.").or(z.literal("")).optional(),
})

export const updateTagApiSchema = createTagApiSchema.partial()

export const createPersonApiSchema = z.object({
  name: z.string().min(1, "Name is required.").max(255, "Name too long."),
  tmdbId: z.number().int().positive().optional().nullable(),
  profileUrl: z.string().url("Invalid URL.").or(z.literal("")).optional().nullable(),
  biography: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  deathday: z.string().optional().nullable(),
  gender: z.number().int().min(0).max(3).optional().nullable(),
  knownForDepartment: z.string().max(50).optional().nullable(),
  popularity: z.number().nonnegative().optional().nullable(),
})

export const updatePersonApiSchema = createPersonApiSchema.partial()

export const backfillCastApiSchema = z.object({
  movieId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(200).optional().default(50),
})

export const addFeaturedApiSchema = z.object({
  movieId: z.number().int().positive("movieId must be a positive integer."),
})

export const updateFeaturedOrderApiSchema = z.object({
  displayOrder: z.number().int("displayOrder must be an integer."),
})

export const reportStatusApiSchema = z.object({
  status: z.enum(["pending", "resolved"]),
})

export const tmdbImportApiSchema = z.object({
  tmdbId: z.number().int().positive("tmdbId must be a positive integer."),
})

export const chatApiSchema = z.object({
  messages: z.array(z.unknown()),
  model: z.string().optional(),
})

export const createCommentApiSchema = z.object({
  content: z.string().min(1, "Content is required.").max(2000, "Comment too long."),
})

export const reportMovieApiSchema = z.object({
  description: z.string().min(1, "Description is required.").max(2000, "Description too long."),
})

export const addToWatchlistApiSchema = z.object({
  movieId: z.number().int().positive("movieId must be a positive integer."),
})

export const requestStatusApiSchema = z.object({
  status: z.enum(["pending", "fulfilled"]),
})

export const tmdbSearchApiSchema = z.object({
  query: z.string().min(1, "query is required."),
})

export const chatEmptySchema = z.object({})

export const chatSearchMoviesSchema = z.object({
  query: z.string().describe("The search keyword or phrase"),
})

export const chatMoviesByGenreSchema = z.object({
  genre: z
    .string()
    .describe("The genre or tag name (e.g., 'action', 'comedy', 'sci-fi')"),
})

export const chatMoviesByDescriptionSchema = z.object({
  query: z
    .string()
    .optional()
    .default("")
    .describe("The plot, theme, or concept to search for"),
})

export const chatPlatformDocsSchema = z.object({
  question: z.string().describe("The question about StreamFlix to answer"),
})

export const adminChatLimitSchema = z.object({
  limit: z.number().int().min(1).max(25).optional().default(10),
})

export const adminChatQuerySchema = z.object({
  query: z.string().min(1).describe("The search keyword or phrase"),
})

export const adminChatMovieIdSchema = z.object({
  movieId: z.number().int().positive().describe("The internal movie ID"),
})

export const adminChatResolveReportSchema = z.object({
  id: z.number().int().positive().describe("The report ID to update"),
  status: z.enum(["pending", "resolved"]).describe("The new report status"),
})

export const adminChatFulfillRequestSchema = z.object({
  id: z.number().int().positive().describe("The movie request ID to fulfill"),
})

export const adminChatAssignTagsSchema = z.object({
  movieId: z.number().int().positive().describe("The internal movie ID"),
  tagIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(20)
    .describe("Tag IDs that fully replace the movie's current tags"),
})

export const adminChatTmdbIdSchema = z.object({
  tmdbId: z.number().int().positive().describe("The TMDB movie ID"),
})

export const cacheFlushApiSchema = z.object({
  scope: z.enum([
    "all",
    "home",
    "movies-list",
    "movie-detail",
    "tags",
    "tag-movies",
    "watchlist",
    "requests",
    "admin",
    "comments",
    "reports",
    "shorts",
  ]),
})
