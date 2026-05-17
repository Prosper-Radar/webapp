import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export type PipelineStatus =
  | "spotted"
  | "reviewing"
  | "loi_submitted"
  | "under_contract"
  | "closed"
  | "dead";

export type ScoreBreakdown = {
  momentum: number;
  location: number;
  value: number;
  liquidity: number;
};

export const parcels = pgTable("parcels", {
  id: uuid("id").defaultRandom().primaryKey(),
  folio: text("folio").notNull().unique(),
  addressLine: text("address_line").notNull(),
  city: text("city").notNull().default("Miami"),
  state: text("state").notNull().default("FL"),
  zip: text("zip").notNull(),
  county: text("county").notNull().default("Miami-Dade"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  acreage: doublePrecision("acreage"),
  zoning: text("zoning"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dealScores = pgTable(
  "deal_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parcelId: uuid("parcel_id")
      .notNull()
      .references(() => parcels.id, { onDelete: "cascade" }),
    totalScore: integer("total_score").notNull(),
    breakdown: jsonb("breakdown").$type<ScoreBreakdown>().notNull(),
    modelVersion: text("model_version").notNull().default("v0-demo"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("deal_scores_parcel_id_uidx").on(t.parcelId)],
);

export const watchlist = pgTable(
  "watchlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userKey: text("user_key").notNull().default("demo"),
    parcelId: uuid("parcel_id")
      .notNull()
      .references(() => parcels.id, { onDelete: "cascade" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("watchlist_user_parcel_uidx").on(t.userKey, t.parcelId)],
);

export const parcelsRelations = relations(parcels, ({ one, many }) => ({
  dealScore: one(dealScores, {
    fields: [parcels.id],
    references: [dealScores.parcelId],
  }),
  watchlistEntries: many(watchlist),
}));

export const dealScoresRelations = relations(dealScores, ({ one }) => ({
  parcel: one(parcels, {
    fields: [dealScores.parcelId],
    references: [parcels.id],
  }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  parcel: one(parcels, {
    fields: [watchlist.parcelId],
    references: [parcels.id],
  }),
}));

// ── Deal pipeline ──────────────────────────────────────────────────────────

export const dealPipeline = pgTable(
  "deal_pipeline",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parcelId: uuid("parcel_id")
      .notNull()
      .references(() => parcels.id, { onDelete: "cascade" }),
    status: text("status").$type<PipelineStatus>().notNull().default("spotted"),
    notes: text("notes"),
    assignedTo: text("assigned_to"),
    addedBy: text("added_by").notNull().default("demo"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pipeline_parcel_user_uidx").on(t.parcelId, t.addedBy)],
);

export const dealPipelineRelations = relations(dealPipeline, ({ one }) => ({
  parcel: one(parcels, {
    fields: [dealPipeline.parcelId],
    references: [parcels.id],
  }),
}));
