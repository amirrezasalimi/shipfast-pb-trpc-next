/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { pbInstance } from "../pocketbase";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { type UsersResponse } from "../pocketbase-schema";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */


export const createTrpcContext = async function (
  opts: FetchCreateContextFnOptions
): Promise<{
  user?: UsersResponse<unknown>;
  req: FetchCreateContextFnOptions["req"];
}> {
  try {
    const cookies = opts.req.headers.get("cookie");

    if (cookies) {
      const _pb = pbInstance();
      _pb.authStore.loadFromCookie(cookies)
      if (_pb.authStore.isValid) {
        const res = await _pb.collection("users").authRefresh();
        if (res?.record) {
          return {
            user: res.record,
            ...opts,
          };
        }
      } else {
        // throw Error("Invalid token");
      }
    }
  } catch (e) {
    // console.log("context error:",e);
  }
  // todo: find better approach
  return {
    req: opts.req
  } as {
    req: FetchCreateContextFnOptions["req"];
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;


// rate limiter
const opts = {
  points: 20,
  duration: 1, // Per second
};

const rateLimiter = new RateLimiterMemory(opts);

const getFingerprint = (req: Request & {
  ip?: string;
  headers: Headers;
}) => {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? (typeof forwarded === "string" ? forwarded : forwarded[0])?.split(/, /)[0]
    : req.ip;
  return ip ?? "127.0.0.1";
};
export const userProcedure = publicProcedure
  .use(async (opts) => {
    const ip = getFingerprint(opts.ctx.req);
    try {
      await rateLimiter.consume(ip);
    } catch (e) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests",
      });
    }
    return opts.next();
  })
  .use(async (opts) => {
    if (!opts.ctx.user) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "We don't take kindly to out-of-town folk",
      });
    }

    return opts.next();
  });