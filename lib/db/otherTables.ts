import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Creator Strikes (for content violations)
export const creatorStrikes = pgTable("CreatorStrike", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  contentId: text("contentId"),
  contentType: text("contentType"), // 'movie' or 'series'
  reason: text("reason").notNull(),
  severity: text("severity").notNull(), // 'warning', 'minor', 'major', 'critical'
  issuedBy: text("issuedBy").notNull(), // adminId
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
})

export const creatorStrikesRelations = relations(creatorStrikes, ({ one }) => ({
  creator: one(creatorStrikes, {
    fields: [creatorStrikes.userId],
    references: [creatorStrikes.id],
  }),
}))

// Daily Upload Tracking (prevent spam uploads)
export const dailyUploadTracking = pgTable("DailyUploadTracking", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  uploadDate: timestamp("uploadDate").notNull(),
  uploadCount: integer("uploadCount").default(0).notNull(),
  contentType: text("contentType").notNull(), // 'movie' or 'series'
})

export const dailyUploadTrackingRelations = relations(dailyUploadTracking, ({ one }) => ({
  user: one(dailyUploadTracking, {
    fields: [dailyUploadTracking.userId],
    references: [dailyUploadTracking.id],
  }),
}))
