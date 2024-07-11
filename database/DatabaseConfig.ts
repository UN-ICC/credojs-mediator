import { AskarWalletPostgresStorageConfig } from "@credo-ts/askar";

export const POSTGRES_HOST = process.env.POSTGRES_HOST;
export const POSTGRES_USER = process.env.POSTGRES_USER;
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;

export const askarPostgresConfig: AskarWalletPostgresStorageConfig = {
  // AskarWalletPostgresStorageConfig defines interface for the Postgres plugin configuration.
  type: "postgres",
  config: {
    host: POSTGRES_HOST as string,
    connectTimeout: 10,
  },
  credentials: {
    account: POSTGRES_USER as string,
    password: POSTGRES_PASSWORD as string,
    adminAccount: POSTGRES_USER as string,
    adminPassword: POSTGRES_PASSWORD as string,
  },
};
