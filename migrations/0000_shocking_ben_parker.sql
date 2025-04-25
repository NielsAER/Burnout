CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"threshold" integer NOT NULL,
	"unlocked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"username" text,
	"permissions" json DEFAULT '["read"]'::json,
	"credentials" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"trigger_app_id" text NOT NULL,
	"trigger_config" json NOT NULL,
	"action_app_id" text NOT NULL,
	"action_config" json NOT NULL,
	"actions" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_run_at" timestamp,
	"runs_today" integer DEFAULT 0 NOT NULL,
	"health_score" integer DEFAULT 100 NOT NULL,
	"complexity" integer DEFAULT 1 NOT NULL,
	"reliability" json DEFAULT '{"successRate":100,"errorCount":0,"totalRuns":0}'::json
);
--> statement-breakpoint
CREATE TABLE "execution_histories" (
	"id" serial PRIMARY KEY NOT NULL,
	"automation_id" integer NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"duration" integer,
	"level" text DEFAULT 'info',
	"data" json
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"trigger_app_id" text NOT NULL,
	"action_app_id" text NOT NULL,
	"template_config" json NOT NULL,
	"popular" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"achievement_id" integer NOT NULL,
	"automation_id" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"full_name" text,
	"bio" text,
	"avatar_url" text,
	"company_name" text,
	"vat_number" text,
	"role" text DEFAULT 'user',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workflow_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"trigger_app_id" text NOT NULL,
	"action_app_id" text NOT NULL,
	"config" json DEFAULT '{}'::json,
	"category" text NOT NULL,
	"personalized" boolean DEFAULT false,
	"relevance_score" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now() NOT NULL
);
