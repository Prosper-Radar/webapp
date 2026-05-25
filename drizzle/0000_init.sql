CREATE TABLE "deal_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parcel_id" uuid NOT NULL,
	"total_score" integer NOT NULL,
	"breakdown" jsonb NOT NULL,
	"model_version" text DEFAULT 'v0-demo' NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" text NOT NULL,
	"address_line" text NOT NULL,
	"city" text DEFAULT 'Miami' NOT NULL,
	"state" text DEFAULT 'FL' NOT NULL,
	"zip" text NOT NULL,
	"county" text DEFAULT 'Miami-Dade' NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"acreage" double precision,
	"zoning" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parcels_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_key" text DEFAULT 'demo' NOT NULL,
	"parcel_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deal_scores" ADD CONSTRAINT "deal_scores_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deal_scores_parcel_id_uidx" ON "deal_scores" USING btree ("parcel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_user_parcel_uidx" ON "watchlist" USING btree ("user_key","parcel_id");