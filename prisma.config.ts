import "dotenv/config";
import { defineConfig } from "prisma/config";

const isGenerateCommand = process.argv.includes("generate");
const DATABASE_URL =
  process.env.DATABASE_URL ??
  (isGenerateCommand
    ? "postgresql://formflow:formflow@localhost:5432/formflow?schema=public"
    : undefined);

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to your .env file.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
