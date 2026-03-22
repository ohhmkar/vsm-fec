CREATE TABLE IF NOT EXISTS "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_applicable" smallint NOT NULL,
	"content" text NOT NULL,
	"for_insider" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	CONSTRAINT "player_account_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_portfolio" (
	"player_id" uuid NOT NULL,
	"bank_balance" double precision NOT NULL,
	"total_portfolio_value" double precision NOT NULL,
	"stocks" json NOT NULL,
	CONSTRAINT "player_portfolio_player_id_unique" UNIQUE("player_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_powerups" (
	"player_id" uuid NOT NULL,
	"insider_trading_status" varchar DEFAULT 'Unused' NOT NULL,
	"muft_ka_paisa_status" varchar DEFAULT 'Unused' NOT NULL,
	"stock_betting_status" varchar DEFAULT 'Unused' NOT NULL,
	"stock_betting_amount" double precision,
	"stock_betting_prediction" "char",
	"stock_betting_locked_symbol" varchar,
	"stock_betting_locked_price" double precision,
	CONSTRAINT "player_powerups_player_id_unique" UNIQUE("player_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar NOT NULL,
	"round_applicable" smallint NOT NULL,
	"volatility" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stocks_game" (
	"symbol" varchar PRIMARY KEY NOT NULL,
	"round_introduced" smallint NOT NULL,
	"price" double precision NOT NULL,
	"volatility" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"u1Name" varchar NOT NULL,
	"u2Name" varchar,
	"is_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_account" ADD CONSTRAINT "player_account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_portfolio" ADD CONSTRAINT "player_portfolio_player_id_player_account_id_fk" FOREIGN KEY ("player_id") REFERENCES "player_account"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_powerups" ADD CONSTRAINT "player_powerups_player_id_player_account_id_fk" FOREIGN KEY ("player_id") REFERENCES "player_account"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
