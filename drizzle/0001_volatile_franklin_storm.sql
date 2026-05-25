CREATE TABLE "deal_pipeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parcel_id" uuid NOT NULL,
	"status" text DEFAULT 'spotted' NOT NULL,
	"notes" text,
	"assigned_to" text,
	"added_by" text DEFAULT 'demo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deal_pipeline" ADD CONSTRAINT "deal_pipeline_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pipeline_parcel_user_uidx" ON "deal_pipeline" USING btree ("parcel_id","added_by");