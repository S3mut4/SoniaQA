import dotenv from "dotenv";
import path from "path";

// locally the values come from env/dev.env; in CI they come from repository variables
if (!process.env.CI) {
  dotenv.config({
    path: path.resolve(__dirname, "../env/dev.env"),
    quiet: true,
  });
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}: copy env/dev.env.example to env/dev.env`);
  }
  return value;
}

export const BASE_URL = required("BASE_URL");
