CREATE TABLE IF NOT EXISTS "donation_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "donation_id" uuid REFERENCES "donations"("id") ON DELETE CASCADE,
  "tag" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donation_tags_donation_id_idx" ON "donation_tags"("donation_id");