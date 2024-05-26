import Pocketbase, { LocalAuthStore } from "pocketbase";
const POCKETBASE_HOST = process.env.NEXT_PUBLIC_POCKETBASE_HOST;
export const pb_client = new Pocketbase(POCKETBASE_HOST, new LocalAuthStore());