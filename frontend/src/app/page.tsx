import { redirect } from "next/navigation";
import { LINKS } from "~/shared/constants/links";

export default async function Home() {
  redirect(LINKS.DASHBOARD);
  return <></>;
}
