CREATE TYPE "public"."community_member_role" AS ENUM('admin', 'worker', 'contractor');--> statement-breakpoint
CREATE TYPE "public"."invitation_role" AS ENUM('admin', 'worker', 'contractor', 'owner', 'resident');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('stairwell', 'elevator', 'entrance', 'basement', 'attic', 'parking', 'courtyard', 'garbage_area', 'other');--> statement-breakpoint
CREATE TYPE "public"."unit_member_role" AS ENUM('owner', 'resident');--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" text PRIMARY KEY DEFAULT 'building_' || replace(gen_random_uuid()::text, '-', '') NOT NULL,
	"community_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buildings_community_id_name_unique" UNIQUE("community_id","name")
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" text PRIMARY KEY DEFAULT 'community_' || replace(gen_random_uuid()::text, '-', '') NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"id" text PRIMARY KEY DEFAULT 'community_member_' || replace(gen_random_uuid()::text, '-', '') NOT NULL,
	"community_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "community_member_role" NOT NULL,
	"company_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_members_community_id_user_id_unique" UNIQUE("community_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY DEFAULT 'invitation_' || replace(gen_random_uuid()::text, '-', '') NOT NULL,
	"community_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "invitation_role" NOT NULL,
	"unit_id" text,
	"company_name" text,
	"token_hash" text NOT NULL,
	"invited_by" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "invitations_unit_matches_role" CHECK (("invitations"."role" in ('owner', 'resident')) = ("invitations"."unit_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY DEFAULT 'location_' || replace(gen_random_uuid()::text, '-', '') NOT NULL,
	"community_id" text NOT NULL,
	"building_id" text,
	"staircase_id" text,
	"type" "location_type" NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_staircase_requires_building" CHECK ("locations"."staircase_id" is null or "locations"."building_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "staircases" (
	"id" text PRIMARY KEY DEFAULT 'staircase_' || replace(gen_random_uuid()::text, '-', '') NOT NULL,
	"building_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staircases_building_id_name_unique" UNIQUE("building_id","name")
);
--> statement-breakpoint
CREATE TABLE "unit_members" (
	"id" text PRIMARY KEY DEFAULT 'unit_member_' || replace(gen_random_uuid()::text, '-', '') NOT NULL,
	"unit_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "unit_member_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unit_members_unit_id_user_id_unique" UNIQUE("unit_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY DEFAULT 'unit_' || replace(gen_random_uuid()::text, '-', '') NOT NULL,
	"staircase_id" text NOT NULL,
	"number" text NOT NULL,
	"floor" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "units_staircase_id_number_unique" UNIQUE("staircase_id","number")
);
--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_staircase_id_staircases_id_fk" FOREIGN KEY ("staircase_id") REFERENCES "public"."staircases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staircases" ADD CONSTRAINT "staircases_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_members" ADD CONSTRAINT "unit_members_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_members" ADD CONSTRAINT "unit_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_staircase_id_staircases_id_fk" FOREIGN KEY ("staircase_id") REFERENCES "public"."staircases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_members_user_id_index" ON "community_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitations_community_id_index" ON "invitations" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "invitations_email_index" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "locations_community_id_index" ON "locations" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "unit_members_user_id_index" ON "unit_members" USING btree ("user_id");