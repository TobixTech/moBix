import { pgTable, text, integer, boolean, timestamp, primaryKey, decimal } from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"
import { creatorStrikes, dailyUploadTracking } from "./otherTables" // Assuming these are declared in another file

export { creatorStrikes, dailyUploadTracking }

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
  countryChangedAt: timestamp("countryChangedAt"),
  isPremium: boolean("isPremium").default(false).notNull(),
  premiumExpiresAt: timestamp("premiumExpiresAt"),
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
  seriesLikes: many(seriesLikes),
  seriesComments: many(seriesComments),
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
  isTop: boolean("isTop").default(false).notNull(),
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

// Promotion Views/Analytics table
export const promotionViews = pgTable("PromotionView", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ipAddress").notNull(),
  country: text("country"),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  submitted: boolean("submitted").default(false).notNull(),
})

export const promotionViewsRelations = relations(promotionViews, ({ one }) => ({
  user: one(users, {
    fields: [promotionViews.userId],
    references: [users.id],
  }),
}))

// Targeted Promotions table for manual user selection
export const targetedPromotions = pgTable("TargetedPromotion", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason"),
  shown: boolean("shown").default(false).notNull(),
  dismissed: boolean("dismissed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  shownAt: timestamp("shownAt"),
})

export const targetedPromotionsRelations = relations(targetedPromotions, ({ one }) => ({
  user: one(users, {
    fields: [targetedPromotions.userId],
    references: [users.id],
  }),
}))

// TV Series
export const series = pgTable("Series", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  slug: text("slug").unique(),
  title: text("title").unique().notNull(),
  description: text("description").notNull(),
  posterUrl: text("posterUrl").notNull(),
  bannerUrl: text("bannerUrl"),
  genre: text("genre").notNull(),
  releaseYear: integer("releaseYear").notNull(),
  status: text("status").default("ongoing").notNull(), // 'ongoing', 'completed', 'cancelled'
  totalSeasons: integer("totalSeasons").default(0).notNull(),
  totalEpisodes: integer("totalEpisodes").default(0).notNull(),
  averageRating: decimal("averageRating", { precision: 2, scale: 1 }).default("0"),
  views: integer("views").default(0).notNull(),
  isTrending: boolean("isTrending").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const seriesRelations = relations(series, ({ many }) => ({
  seasons: many(seasons),
  seriesWatchHistory: many(seriesWatchHistory),
  seriesWatchlist: many(seriesWatchlist),
  seriesRatings: many(seriesRatings),
  seriesLikes: many(seriesLikes),
  seriesComments: many(seriesComments),
  seriesReports: many(seriesReports),
}))

// Seasons
export const seasons = pgTable("Season", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  seriesId: text("seriesId")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  seasonNumber: integer("seasonNumber").notNull(),
  title: text("title"),
  description: text("description"),
  posterUrl: text("posterUrl"),
  releaseYear: integer("releaseYear"),
  totalEpisodes: integer("totalEpisodes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  series: one(series, {
    fields: [seasons.seriesId],
    references: [series.id],
  }),
  episodes: many(episodes),
}))

// Episodes
export const episodes = pgTable("Episode", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  seasonId: text("seasonId")
    .notNull()
    .references(() => seasons.id, { onDelete: "cascade" }),
  episodeNumber: integer("episodeNumber").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration"), // in minutes
  thumbnailUrl: text("thumbnailUrl"),
  videoUrl: text("videoUrl").notNull(),
  downloadUrl: text("downloadUrl"),
  downloadEnabled: boolean("downloadEnabled").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  releaseDate: timestamp("releaseDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  season: one(seasons, {
    fields: [episodes.seasonId],
    references: [seasons.id],
  }),
  watchHistory: many(seriesWatchHistory),
}))

// Series Watch History
export const seriesWatchHistory = pgTable("SeriesWatchHistory", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seriesId: text("seriesId")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  episodeId: text("episodeId")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  progress: integer("progress").default(0).notNull(),
  duration: integer("duration").default(0).notNull(),
  watchedAt: timestamp("watchedAt").defaultNow().notNull(),
})

export const seriesWatchHistoryRelations = relations(seriesWatchHistory, ({ one }) => ({
  user: one(users, {
    fields: [seriesWatchHistory.userId],
    references: [users.id],
  }),
  series: one(series, {
    fields: [seriesWatchHistory.seriesId],
    references: [series.id],
  }),
  episode: one(episodes, {
    fields: [seriesWatchHistory.episodeId],
    references: [episodes.id],
  }),
}))

// Series Watchlist
export const seriesWatchlist = pgTable("SeriesWatchlist", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seriesId: text("seriesId")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const seriesWatchlistRelations = relations(seriesWatchlist, ({ one }) => ({
  user: one(users, {
    fields: [seriesWatchlist.userId],
    references: [users.id],
  }),
  series: one(series, {
    fields: [seriesWatchlist.seriesId],
    references: [series.id],
  }),
}))

// Series Ratings
export const seriesRatings = pgTable("SeriesRating", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seriesId: text("seriesId")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const seriesRatingsRelations = relations(seriesRatings, ({ one }) => ({
  user: one(users, {
    fields: [seriesRatings.userId],
    references: [users.id],
  }),
  series: one(series, {
    fields: [seriesRatings.seriesId],
    references: [series.id],
  }),
}))

// Series Likes
export const seriesLikes = pgTable("SeriesLike", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seriesId: text("seriesId")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const seriesLikesRelations = relations(seriesLikes, ({ one }) => ({
  user: one(users, {
    fields: [seriesLikes.userId],
    references: [users.id],
  }),
  series: one(series, {
    fields: [seriesLikes.seriesId],
    references: [series.id],
  }),
}))

// Series Comments
export const seriesComments = pgTable("SeriesComment", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seriesId: text("seriesId")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  rating: integer("rating").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const seriesCommentsRelations = relations(seriesComments, ({ one }) => ({
  user: one(users, {
    fields: [seriesComments.userId],
    references: [users.id],
  }),
  series: one(series, {
    fields: [seriesComments.seriesId],
    references: [series.id],
  }),
}))

// Series Reports table
export const seriesReports = pgTable("SeriesReport", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  seriesId: text("seriesId")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description"),
  email: text("email"),
  status: text("status").default("PENDING").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const seriesReportsRelations = relations(seriesReports, ({ one }) => ({
  user: one(users, {
    fields: [seriesReports.userId],
    references: [users.id],
  }),
  series: one(series, {
    fields: [seriesReports.seriesId],
    references: [series.id],
  }),
}))

// Site Settings table
export const siteSettings = pgTable("SiteSettings", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
  type: text("type").default("string"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow(),
})

// Creator System Tables

// Creator Requests - for users requesting creator access
export const creatorRequests = pgTable("CreatorRequest", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: text("reviewedBy").references(() => users.id, { onDelete: "set null" }),
  rejectionReason: text("rejectionReason"),
})

export const creatorRequestsRelations = relations(creatorRequests, ({ one }) => ({
  user: one(users, {
    fields: [creatorRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [creatorRequests.reviewedBy],
    references: [users.id],
  }),
}))

// Creator Profiles - for approved creators
export const creatorProfiles = pgTable("CreatorProfile", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  isAutoApproveEnabled: boolean("isAutoApproveEnabled").default(false).notNull(),
  dailyUploadLimit: integer("dailyUploadLimit").default(4).notNull(),
  dailyStorageLimitGb: decimal("dailyStorageLimitGb", { precision: 5, scale: 2 }).default("8").notNull(),
  totalUploads: integer("totalUploads").default(0).notNull(),
  totalViews: integer("totalViews").default(0).notNull(),
  status: text("status").default("active").notNull(), // 'active', 'suspended', 'banned'
  suspendedReason: text("suspendedReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const creatorProfilesRelations = relations(creatorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [creatorProfiles.userId],
    references: [users.id],
  }),
  submissions: many(contentSubmissions),
  strikes: many(creatorStrikes),
  dailyTracking: many(dailyUploadTracking),
}))

// Content Submissions - creator uploaded content
export const contentSubmissions = pgTable("ContentSubmission", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  creatorId: text("creatorId")
    .notNull()
    .references(() => creatorProfiles.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'movie', 'series'
  title: text("title").notNull(),
  description: text("description").notNull(),
  genre: text("genre").notNull(),
  year: integer("year"),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl").notNull(),
  bannerUrl: text("bannerUrl"),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  rejectionReason: text("rejectionReason"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: text("reviewedBy").references(() => users.id, { onDelete: "set null" }),
  viewsCount: integer("viewsCount").default(0).notNull(),
  likesCount: integer("likesCount").default(0).notNull(),
  // For series: store season/episode info as JSON
  seriesData: text("seriesData"), // JSON: { totalSeasons, totalEpisodes, status }
  // Reference to published movie/series
  publishedMovieId: text("publishedMovieId").references(() => movies.id, { onDelete: "set null" }),
  publishedSeriesId: text("publishedSeriesId").references(() => series.id, { onDelete: "set null" }),
  fileSizeGb: decimal("fileSizeGb", { precision: 10, scale: 4 }),
})

export const contentSubmissionsRelations = relations(contentSubmissions, ({ one, many }) => ({
  creator: one(creatorProfiles, {
    fields: [contentSubmissions.creatorId],
    references: [creatorProfiles.id],
  }),
  reviewer: one(users, {
    fields: [contentSubmissions.reviewedBy],
    references: [users.id],
  }),
  publishedMovie: one(movies, {
    fields: [contentSubmissions.publishedMovieId],
    references: [movies.id],
  }),
  publishedSeries: one(series, {
    fields: [contentSubmissions.publishedSeriesId],
    references: [series.id],
  }),
  episodes: many(submissionEpisodes),
  analytics: many(creatorAnalytics),
}))

// Submission Episodes - for series submissions
export const submissionEpisodes = pgTable("SubmissionEpisode", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  submissionId: text("submissionId")
    .notNull()
    .references(() => contentSubmissions.id, { onDelete: "cascade" }),
  seasonNumber: integer("seasonNumber").notNull(),
  episodeNumber: integer("episodeNumber").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  duration: integer("duration"), // in minutes
  fileSizeGb: decimal("fileSizeGb", { precision: 10, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const submissionEpisodesRelations = relations(submissionEpisodes, ({ one }) => ({
  submission: one(contentSubmissions, {
    fields: [submissionEpisodes.submissionId],
    references: [contentSubmissions.id],
  }),
}))

// Creator Analytics - track performance per submission
export const creatorAnalytics = pgTable("CreatorAnalytics", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  submissionId: text("submissionId")
    .notNull()
    .references(() => contentSubmissions.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  views: integer("views").default(0).notNull(),
  watchTimeMinutes: integer("watchTimeMinutes").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  favorites: integer("favorites").default(0).notNull(),
})

// Creator Wallets (crypto wallet management)
export const creatorWallets = pgTable("CreatorWallet", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().unique(),
  cryptoType: text("cryptoType").notNull(), // 'SOL', 'TRC20', 'BEP20'
  walletAddress: text("walletAddress").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastChangedAt: timestamp("lastChangedAt").defaultNow().notNull(),
  canChangeAt: timestamp("canChangeAt").notNull(), // 3 weeks from last change
  changeHistory: text("changeHistory").default("[]").notNull(), // JSON array of previous addresses
})

export const creatorWalletsRelations = relations(creatorWallets, ({ one }) => ({
  user: one(users, {
    fields: [creatorWallets.userId],
    references: [users.id],
  }),
}))

// Creator Withdrawal PINs (security for withdrawals)
export const creatorWithdrawalPins = pgTable("CreatorWithdrawalPin", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().unique(),
  pinHash: text("pinHash").notNull(), // bcrypt hashed PIN
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastChangedAt: timestamp("lastChangedAt").defaultNow().notNull(),
})

export const creatorWithdrawalPinsRelations = relations(creatorWithdrawalPins, ({ one }) => ({
  user: one(users, {
    fields: [creatorWithdrawalPins.userId],
    references: [users.id],
  }),
}))

// Creator Earnings (tracks all earnings from content views)
export const creatorEarnings = pgTable("CreatorEarning", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  contentId: text("contentId").notNull(),
  contentType: text("contentType").notNull(), // 'movie' or 'series'
  earnedAt: timestamp("earnedAt").notNull(),
  views: integer("views").default(0).notNull(),
  earningsUsd: decimal("earningsUsd", { precision: 10, scale: 4 }).default("0").notNull(),
  tierRate: decimal("tierRate", { precision: 10, scale: 6 }).notNull(),
  bonusMultiplier: decimal("bonusMultiplier", { precision: 3, scale: 2 }).default("1.00").notNull(),
  isPaid: boolean("isPaid").default(false).notNull(),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  weekNumber: integer("weekNumber").notNull(), // week of year
})

export const creatorEarningsRelations = relations(creatorEarnings, ({ one }) => ({
  user: one(users, {
    fields: [creatorEarnings.userId],
    references: [users.id],
  }),
}))

// Creator Tiers (Bronze, Silver, Gold, Platinum)
export const creatorTiers = pgTable("CreatorTier", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().unique(),
  tierLevel: text("tierLevel").notNull(), // 'bronze', 'silver', 'gold', 'platinum'
  totalViews: integer("totalViews").default(0).notNull(),
  ratePerView: decimal("ratePerView", { precision: 10, scale: 6 }).notNull(),
  requestedAt: timestamp("requestedAt"),
  approvedAt: timestamp("approvedAt").defaultNow().notNull(),
  approvedBy: text("approvedBy"), // adminId
})

export const creatorTiersRelations = relations(creatorTiers, ({ one }) => ({
  user: one(users, {
    fields: [creatorTiers.userId],
    references: [users.id],
  }),
}))

// Creator Settings (payout settings and limits)
export const creatorSettings = pgTable("CreatorSetting", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().unique(),
  monthlyWithdrawalLimit: decimal("monthlyWithdrawalLimit", { precision: 10, scale: 2 }).default("100.00").notNull(),
  holdingPeriodDays: integer("holdingPeriodDays").default(7).notNull(),
  canWithdraw: boolean("canWithdraw").default(true).notNull(),
  isPremium: boolean("isPremium").default(false).notNull(),
  pausedBy: text("pausedBy"), // adminId who paused
  pausedReason: text("pausedReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const creatorSettingsRelations = relations(creatorSettings, ({ one }) => ({
  user: one(users, {
    fields: [creatorSettings.userId],
    references: [users.id],
  }),
}))

// Payout Requests (withdrawal requests from creators)
export const payoutRequests = pgTable("PayoutRequest", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  amountUsd: decimal("amountUsd", { precision: 10, scale: 2 }).notNull(),
  cryptoType: text("cryptoType").notNull(), // 'SOL', 'TRC20', 'BEP20'
  walletAddress: text("walletAddress").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected', 'completed'
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  processedBy: text("processedBy"), // adminId
  adminNote: text("adminNote"),
  transactionHash: text("transactionHash"),
  rejectionReason: text("rejectionReason"),
})

export const payoutRequestsRelations = relations(payoutRequests, ({ one }) => ({
  user: one(users, {
    fields: [payoutRequests.userId],
    references: [users.id],
  }),
}))

// Creator Notifications (system notifications for creators)
export const creatorNotifications = pgTable("CreatorNotification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  type: text("type").notNull(), // 'payout', 'tier_upgrade', 'offer', 'strike', 'system'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const creatorNotificationsRelations = relations(creatorNotifications, ({ one }) => ({
  user: one(users, {
    fields: [creatorNotifications.userId],
    references: [users.id],
  }),
}))

// Creator View Analytics (detailed view tracking)
export const creatorViewAnalytics = pgTable("CreatorViewAnalytic", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  contentId: text("contentId").notNull(),
  contentType: text("contentType").notNull(), // 'movie' or 'series'
  date: timestamp("date").notNull(),
  country: text("country"),
  deviceType: text("deviceType"), // 'mobile', 'desktop', 'tablet'
  viewSource: text("viewSource"), // 'search', 'browse', 'home', 'direct'
  viewCount: integer("viewCount").default(1).notNull(),
})

export const creatorViewAnalyticsRelations = relations(creatorViewAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [creatorViewAnalytics.userId],
    references: [users.id],
  }),
}))

// Creator Fraud Flags (security and fraud detection)
export const creatorFraudFlag = pgTable("CreatorFraudFlag", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  flagType: text("flagType").notNull(), // 'duplicate_content', 'pirated_content', 'suspicious_activity', 'multiple_accounts'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  description: text("description").notNull(),
  contentId: text("contentId"),
  isResolved: boolean("isResolved").default(false).notNull(),
  flaggedAt: timestamp("flaggedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: text("resolvedBy"), // adminId
  resolutionNote: text("resolutionNote"),
})

export const creatorFraudFlagRelations = relations(creatorFraudFlag, ({ one }) => ({
  user: one(users, {
    fields: [creatorFraudFlag.userId],
    references: [users.id],
  }),
}))

// Creator IP Logs (track IP addresses for security)
export const creatorIPLog = pgTable("CreatorIPLog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  ipAddress: text("ipAddress").notNull(),
  action: text("action").notNull(), // 'login', 'upload', 'withdrawal_request', 'wallet_change'
  country: text("country"),
  city: text("city"),
  device: text("device"),
  browser: text("browser"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
})

export const creatorIPLogRelations = relations(creatorIPLog, ({ one }) => ({
  user: one(users, {
    fields: [creatorIPLog.userId],
    references: [users.id],
  }),
}))

// Creator Chargeback (reversal of payouts)
export const creatorChargeback = pgTable("CreatorChargeback", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  payoutRequestId: text("payoutRequestId").notNull(),
  amountUsd: decimal("amountUsd", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'completed', 'rejected'
  initiatedBy: text("initiatedBy").notNull(), // adminId
  initiatedAt: timestamp("initiatedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
})

export const creatorChargebackRelations = relations(creatorChargeback, ({ one }) => ({
  user: one(users, {
    fields: [creatorChargeback.userId],
    references: [users.id],
  }),
  payoutRequest: one(payoutRequests, {
    fields: [creatorChargeback.payoutRequestId],
    references: [payoutRequests.id],
  }),
}))
