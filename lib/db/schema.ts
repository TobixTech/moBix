import { pgTable, text, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Users
export const users = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clerkId: text("clerkId").unique().notNull(),
  email: text("email").unique().notNull(),
  role: text("role").default("USER").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const usersRelations = relations(users, ({ many }) => ({
  likes: many(likes),
  comments: many(comments),
}))

// Movies
export const movies = pgTable("Movie", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  year: integer("year").notNull(),
  genre: text("genre").notNull(),
  posterUrl: text("posterUrl").notNull(),
  videoUrl: text("videoUrl").notNull(),
  customVastUrl: text("customVastUrl"),
  useGlobalAd: boolean("useGlobalAd").default(true).notNull(),
  downloadUrl: text("downloadUrl"),
  downloadEnabled: boolean("downloadEnabled").default(false).notNull(),
  isTrending: boolean("isTrending").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const moviesRelations = relations(movies, ({ many }) => ({
  likes: many(likes),
  comments: many(comments),
}))

// Likes
export const likes = pgTable(
  "Like",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: text("movieId")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    unq: primaryKey({ columns: [t.userId, t.movieId] }), // Composite unique constraint equivalent
  }),
)

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [likes.movieId],
    references: [movies.id],
  }),
}))

// Comments
export const comments = pgTable("Comment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  movieId: text("movieId")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  rating: integer("rating").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [comments.movieId],
    references: [movies.id],
  }),
}))

// Admin Invites
export const adminInvites = pgTable("AdminInvite", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").unique().notNull(),
  isValid: boolean("isValid").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

// Ad Settings
export const adSettings = pgTable("AdSettings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  horizontalAdCode: text("horizontalAdCode"),
  verticalAdCode: text("verticalAdCode"),
  vastUrl: text("vastUrl"),
  smartLinkUrl: text("smartLinkUrl"),
  adTimeoutSeconds: integer("adTimeoutSeconds").default(20).notNull(),
  showPrerollAds: boolean("showPrerollAds").default(true).notNull(),
  showDownloadPageAds: boolean("showDownloadPageAds").default(true).notNull(),
  homepageEnabled: boolean("homepageEnabled").default(true).notNull(),
  movieDetailEnabled: boolean("movieDetailEnabled").default(true).notNull(),
  dashboardEnabled: boolean("dashboardEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})
