import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../../generated/prisma/client.js";
import { appConfig } from "../../core/config/app.config.js";

const adapter = new PrismaBetterSqlite3({
  url: appConfig.database.url,
});

export const prisma = new PrismaClient({
  adapter,
});