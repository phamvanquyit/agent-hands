import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0023_dynamic_apis_draft_code",
  up: [
    `ALTER TABLE dynamic_apis ADD COLUMN draft_code TEXT`,
  ],
};

export default migration;
