CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`source_url` text NOT NULL,
	`source_page` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`refreshed_at` text,
	CONSTRAINT "vendors_source_page_check" CHECK("vendors"."source_page" IN (1, 2))
);
