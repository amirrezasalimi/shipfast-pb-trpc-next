import { TRPCError } from "@trpc/server";
import { ClientResponseError } from "pocketbase";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { pb_admin } from "~/server/pocketbase";


export const authRouter = createTRPCRouter({
  userExists: publicProcedure
    .input(
      z.object({
        email: z.string(),
      })
    )
    .mutation(
      async ({
        input,
      }): Promise<
        | {
          has_password: boolean;
        }
        | boolean
      > => {
        try {
          const user = await pb_admin
            .collection("users")
            .getFirstListItem(`email = "${input.email}"`);
          let authMethodsLen = 0;
          try {
            const authMethods = await pb_admin
              .collection("users")
              .listExternalAuths(user.id);
            authMethodsLen = authMethods.length;
          } catch (e) {
            if (e instanceof ClientResponseError) {

              console.log(`error`, e.originalError);
            }
          }
          return {
            has_password: authMethodsLen == 0,
          };
        } catch (e) {
          if (e instanceof ClientResponseError) {

            console.error("error: ", e.originalError);
          }

          return false;
        }
      }
    ),
  registerUser: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const user = await pb_admin
          .collection("users")
          .getFirstListItem(`email = "${input.email}"`);

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already exists",
          // optional: pass the original error to retain stack trace
          cause: new Error("User already exists"),
        });
      } catch (e) { }

      try {
        const res = await pb_admin.collection("users").create({
          name: "",
          email: input.email,
          password: input.password,
          passwordConfirm: input.password,
        });
        await pb_admin.collection("users").requestVerification(input.email);
        return res;
      } catch (e) {
        console.log(`error`, e);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register user",
          cause: e,
        });
      }
    }),
  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await pb_admin.collection("users").requestPasswordReset(input.email);
        return true;
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reset password",
          cause: e,
        });
      }
    }),
});
