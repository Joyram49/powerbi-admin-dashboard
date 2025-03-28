import { redirect } from "next/navigation";

import { createClientServer } from "@acme/db";

import DeleteUserBtn from "./_components/delete-user-btn";
import SignOutBtn from "./_components/sign-out";

export default async function PrivatePage() {
  const supabase = createClientServer();

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    redirect("/login");
  }

  console.log(data);

  return (
    <div>
      <p>Hello {data.user.email}</p>
      <SignOutBtn />
      <DeleteUserBtn />
    </div>
  );
}
