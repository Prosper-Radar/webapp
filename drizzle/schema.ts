/**
 * Drizzle schema — aligné sur le schéma DB post-migrations 0005+0006.
 *
 * Ce fichier est la référence de types pour le webapp Next.js.
 * Il NE gère PLUS les migrations — seul Alembic (Python API) fait évoluer le schéma.
 *
 * Colonnes supprimées par migration 0005 :
 *   parcels     : folio, address_line, city, state, zip, lat, lng, acreage, zoning
 *   deal_scores : breakdown, missing_metrics
 *
 * Migration 0006 : watchlist → deal_pipeline (watchlist supprimée)
 */
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export type PipelineStatus =
  | "spotted"
  | "reviewing"
  | "loi_submitted"
  | "under_contract"
  | "closed"
  | "dead";

// ── Parcels ────────────────────────────────────────────────────────────────
export const parcels = pgTable("parcels", {
  id: uuid("id").defaultRandom().primaryKey(),
  parcelId: text("parcel_id").notNull().unique(),
  county: text("county").notNull(),
  ownerName: text("owner_name"),
  ownerAddress: text("owner_address"),
  address: text("address"),
  landValue: integer("land_value"),
  buildingValue: integer("building_value"),
  totalValue: integer("total_value"),
  lotSizeSqft: numeric("lot_size_sqft"),
  zoningCode: text("zoning_code"),
  lastSaleDate: text("last_sale_date"),
  lastSalePrice: integer("last_sale_price"),
  rawData: text("raw_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Deal Scores ────────────────────────────────────────────────────────────
export const dealScores = pgTable("deal_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  parcelId: uuid("parcel_id")
    .notNull()
    .references(() => parcels.id, { onDelete: "cascade" }),
  waterfrontScore: numeric("waterfront_score"),
  zoningScore: numeric("zoning_score"),
  priceScore: numeric("price_score"),
  lotSizeScore: numeric("lot_size_score"),
  populationScore: numeric("population_score"),
  trafficScore: numeric("traffic_score"),
  recencyScore: numeric("recency_score"),
  totalScore: numeric("total_score"),
  tier: text("tier"),
  modelVersion: text("model_version").notNull().default("1.0.0"),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Deal Pipeline ──────────────────────────────────────────────────────────
export const dealPipeline = pgTable("deal_pipeline", {
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
});

// ── Pipeline Activity ─────────────────────────────────────────────────────
export const pipelineActivity = pgTable("pipeline_activity", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipelineId: uuid("pipeline_id")
    .notNull()
    .references(() => dealPipeline.id, { onDelete: "cascade" }),
  parcelId: uuid("parcel_id")
    .notNull()
    .references(() => parcels.id, { onDelete: "cascade" }),
  fromStatus: text("from_status").$type<PipelineStatus | null>(),
  toStatus: text("to_status").$type<PipelineStatus>().notNull(),
  note: text("note"),
  userKey: text("user_key").notNull().default("demo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────
export const parcelsRelations = relations(parcels, ({ one, many }) => ({
  dealScore: one(dealScores, {
    fields: [parcels.id],
    references: [dealScores.parcelId],
  }),
  pipelineEntries: many(dealPipeline),
}));

export const dealScoresRelations = relations(dealScores, ({ one }) => ({
  parcel: one(parcels, {
    fields: [dealScores.parcelId],
    references: [parcels.id],
  }),
}));

export const dealPipelineRelations = relations(dealPipeline, ({ one, many }) => ({
  parcel: one(parcels, {
    fields: [dealPipeline.parcelId],
    references: [parcels.id],
  }),
  activities: many(pipelineActivity),
}));

export const pipelineActivityRelations = relations(pipelineActivity, ({ one }) => ({
  pipeline: one(dealPipeline, {
    fields: [pipelineActivity.pipelineId],
    references: [dealPipeline.id],
  }),
  parcel: one(parcels, {
    fields: [pipelineActivity.parcelId],
    references: [parcels.id],
  }),
}));
