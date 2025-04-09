"use server";

import { redirect } from "next/navigation";

export async function navigate(path: string | null) {
  if (path) {
     redirect(path);
  } else {
    redirect("/");
  }
}
