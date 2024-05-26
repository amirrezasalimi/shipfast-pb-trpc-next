import { type NextRequest } from "next/server";
import { initPbAdmin } from "./server/pocketbase";

export async function middleware(_request: NextRequest) {
    await initPbAdmin();
}