import { PrismaClient } from "@prisma/client";
import { getFallbackStore } from "./fallback-db";

declare global {
  // eslint-disable-next-line no-var
  var __prismaRaw: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prismaProxy: PrismaClient | undefined;
}

const defaultDatabaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_VEWtMXIR9Ac0@ep-bold-meadow-b4fnzihz.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

const rawPrisma: PrismaClient =
  globalThis.__prismaRaw ??
  new PrismaClient({
    datasources: {
      db: {
        url: defaultDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaRaw = rawPrisma;
}

function createPrismaProxy(): PrismaClient {
  const fallbackStore = getFallbackStore();

  return new Proxy(rawPrisma as any, {
    get(target, prop, receiver) {
      if (typeof prop !== "string" || prop.startsWith("$") || prop.startsWith("_")) {
        return Reflect.get(target, prop, receiver);
      }

      const originalModel = target[prop];
      const fallbackModel = (fallbackStore as any)[prop];

      if (!originalModel && !fallbackModel) {
        return Reflect.get(target, prop, receiver);
      }

      return new Proxy(originalModel || {}, {
        get(modelTarget, methodProp, modelReceiver) {
          if (typeof methodProp !== "string") {
            return Reflect.get(modelTarget, methodProp, modelReceiver);
          }

          return async (...args: any[]) => {
            // If already marked unavailable, route directly to fallback for speed
            if (fallbackStore.isDbUnavailable()) {
              if (fallbackModel && typeof fallbackModel[methodProp] === "function") {
                return fallbackModel[methodProp](...args);
              }
            }

            try {
              if (typeof modelTarget[methodProp] === "function") {
                return await modelTarget[methodProp](...args);
              }
            } catch (err: any) {
              const errMsg = err?.message || "";
              const errName = err?.name || "";
              const isConnectionError =
                errMsg.includes("Can't reach database server") ||
                errMsg.includes("ECONNREFUSED") ||
                errMsg.includes("ETIMEDOUT") ||
                errMsg.includes("database system is starting up") ||
                err?.code === "P1001" ||
                errName === "PrismaClientInitializationError" ||
                errName === "PrismaClientKnownRequestError";

              if (isConnectionError) {
                fallbackStore.markDbUnavailable();
                if (fallbackModel && typeof fallbackModel[methodProp] === "function") {
                  return fallbackModel[methodProp](...args);
                }
              }
              throw err;
            }

            if (fallbackModel && typeof fallbackModel[methodProp] === "function") {
              return fallbackModel[methodProp](...args);
            }
            return undefined;
          };
        },
      });
    },
  }) as PrismaClient;
}

export const prisma: PrismaClient =
  globalThis.__prismaProxy ?? (globalThis.__prismaProxy = createPrismaProxy());

export default prisma;
