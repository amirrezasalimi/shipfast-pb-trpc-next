import Pocketbase, { ClientResponseError } from "pocketbase";
import { type TypedPocketBase } from "./pocketbase-schema";
import { env } from "~/env";

const pbInstance = () => {
  const _ = new Pocketbase(env.NEXT_PUBLIC_POCKETBASE_HOST) as TypedPocketBase;
  _.autoCancellation(false);
  return _;
};

export const pb_admin = pbInstance();

const initPbAdmin = async () => {
  // check file cache

  if (pb_admin.authStore.isValid) {
    const auth_res = await pb_admin.admins.authRefresh();
    if (auth_res.token) {
      return auth_res.token;
    }
  }
  // console.log("Connecting to Pocketbase...", env.NEXT_PUBLIC_POCKETBASE_HOST);
  try {
    const authData = await pb_admin.admins
      .authWithPassword(
        env.POCKETBASE_EMAIL,
        env.POCKETBASE_PASSWORD
      );
    if (authData.token) {
      // console.log("Connected to Pocketbase");
    } else {
      // console.log("Failed to connect to Pocketbase");
    }
  } catch (e) {
    if (e instanceof ClientResponseError) {
      // console.log("Failed to connect to Pocketbase", e.originalError);
      pb_admin.authStore.clear();
    }
  }
  return pb_admin.authStore.token;
};

pb_admin.beforeSend = async function (url, options) {
  if (!url.includes("auth-with-password")) {
    if (!pb_admin.authStore.isValid) {
      const token = await initPbAdmin();
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return { url, options };
}





export { initPbAdmin, pbInstance };
