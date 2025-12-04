import { pgTable, text, integer, boolean, timestamp, primaryKey, decimal } from "drizzle-orm/pg-core"
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
  country: text("country"),
  ipAddress: text("ipAddress"),
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
  notifications: many(notifications),
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
  averageRating: decimal("averageRating", { precision: 2, scale: 1 }).default("0"),
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
  ratings: many(ratings),
  watchHistory: many(watchHistory),
  contentReports: many(contentReports),
  notifications: many(notifications),
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

export const pushSubscriptions = pgTable("PushSubscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").unique().notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}))

export const watchHistory = pgTable(
  "WatchHistory",
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
    progress: integer("progress").default(0).notNull(),
    duration: integer("duration").default(0).notNull(),
    watchedAt: timestamp("watchedAt").defaultNow().notNull(),
  },
  (t) => ({
    unq: primaryKey({ columns: [t.userId, t.movieId] }),
  }),
)

export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
  user: one(users, {
    fields: [watchHistory.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [watchHistory.movieId],
    references: [movies.id],
  }),
}))

export const ratings = pgTable(
  "Rating",
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
    rating: integer("rating").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    unq: primaryKey({ columns: [t.userId, t.movieId] }),
  }),
)

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [ratings.movieId],
    references: [movies.id],
  }),
}))

export const contentReports = pgTable("ContentReport", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  movieId: text("movieId")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description"),
  email: text("email"), // Added email column
  status: text("status").default("PENDING").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  user: one(users, {
    fields: [contentReports.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [contentReports.movieId],
    references: [movies.id],
  }),
}))

// Notifications table
export const notifications = pgTable("Notification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("general").notNull(), // 'new_movie', 'system', 'general'
  movieId: text("movieId").references(() => movies.id, { onDelete: "cascade" }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [notifications.movieId],
    references: [movies.id],
  }),
}))

export const promotions = pgTable("Promotion", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  network: text("network").notNull(),
  ipAddress: text("ipAddress").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const promotionsRelations = relations(promotions, ({ one }) => ({
  user: one(users, {
    fields: [promotions.userId],
    references: [users.id],
  }),
}))

export const ipBlacklist = pgTable("IpBlacklist", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ipAddress: text("ipAddress").unique().notNull(),
  reason: text("reason"),
  blacklistedBy: text("blacklistedBy"),
  blacklistedAt: timestamp("blacklistedAt").defaultNow().notNull(),
})

export const promotionSettings = pgTable("PromotionSettings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  isActive: boolean("isActive").default(false).notNull(),
  enabledCountries: text("enabledCountries").default('["Nigeria"]'),
  headline: text("headline").default("Fill Details to Get 1.5GB Data!"),
  subtext: text("subtext").default("(Lucky Draw - Winners announced weekly)"),
  successMessage: text("successMessage").default("Entry recorded! Winners announced every Monday"),
  networkOptions: text("networkOptions").default('{"Nigeria":["MTN","Airtel","Glo","9mobile","Other"]}'),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})
