CREATE TABLE IF NOT EXISTS "donation_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"view_name" text NOT NULL,
	"workspace_id" uuid,
	"amount" boolean DEFAULT true,
	"status" boolean DEFAULT true,
	"payment_type" boolean DEFAULT true,
	"notes" boolean DEFAULT false,
	"filters" jsonb,
	"sorting" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_views" ADD CONSTRAINT "donation_views_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_views" ADD CONSTRAINT "donation_views_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donation_views_workspace_id_idx" ON "donation_views"("workspace_id");