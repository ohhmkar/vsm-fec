ALTER TABLE "player_portfolio" DROP CONSTRAINT "player_portfolio_player_id_unique";--> statement-breakpoint
ALTER TABLE "player_powerups" DROP CONSTRAINT "player_powerups_player_id_unique";--> statement-breakpoint
ALTER TABLE "player_portfolio" ADD PRIMARY KEY ("player_id");--> statement-breakpoint
ALTER TABLE "player_powerups" ADD PRIMARY KEY ("player_id");