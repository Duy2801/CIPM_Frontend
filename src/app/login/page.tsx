import { redirect } from "next/navigation";

export default function RedirectToAuthLogin() {
  redirect("/auth/login");
}
