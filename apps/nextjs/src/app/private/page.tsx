import { redirect } from "next/navigation";

import { createClientServer } from "@acme/db";

import SignOutBtn from "./_components/sign-out";

export default async function PrivatePage() {
  const supabase = createClientServer();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect("/login");
  }

  return (
    <div>
      <p>Hello {data.user.email}</p>
      <SignOutBtn />
    </div>
  );
}
