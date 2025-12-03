import { pgTable, text, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"

// Users
export const users = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clerkId: text("clerkId").unique().notNull(),
  email: text("email").unique().notNull(),
  username: text("username"),
  firstName: text("firstName"),
  lastName: text("lastName"),
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
  watchlist: many(watchlist),
}))

// Movies
export const movies = pgTable("Movie", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  slug: text("slug").unique(),
  title: text("title").unique().notNull(),
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
  feedback: many(feedback),
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

// Feedback table for movie requests and issue reports
export const feedback = pgTable("Feedback", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(), // 'REQUEST' or 'REPORT'
  title: text("title"),
  details: text("details"),
  email: text("email"),
  status: text("status").default("NEW").notNull(), // 'NEW', 'IN_PROGRESS', 'COMPLETE'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

// Watchlist table
export const watchlist = pgTable(
  "Watchlist",
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
    unq: primaryKey({ columns: [t.userId, t.movieId] }),
  }),
)

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(users, {
    fields: [watchlist.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [watchlist.movieId],
    references: [movies.id],
  }),
}))

// Ad Settings
export const adSettings = pgTable("AdSettings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  horizontalAdCode: text("horizontalAdCode"),
  verticalAdCode: text("verticalAdCode"),
  prerollAdCodes: text("prerollAdCodes").default("[]"),
  midrollAdCodes: text("midrollAdCodes").default("[]"),
  midrollEnabled: boolean("midrollEnabled").default(false).notNull(),
  midrollIntervalMinutes: integer("midrollIntervalMinutes").default(20).notNull(),
  prerollEnabled: boolean("prerollEnabled").default(true).notNull(),
  smartLinkUrl: text("smartLinkUrl"),
  adTimeoutSeconds: integer("adTimeoutSeconds").default(20).notNull(),
  skipDelaySeconds: integer("skipDelaySeconds").default(10).notNull(),
  rotationIntervalSeconds: integer("rotationIntervalSeconds").default(5).notNull(),
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
