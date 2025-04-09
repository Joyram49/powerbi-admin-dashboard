import { redirect } from "next/navigation";

import { createClientServer } from "@acme/db";

async function HomePage() {
  const supabase = createClientServer();
  const { user } = await supabase.auth.getUser();
  console.log(user);
  if (!user) {
    redirect("/login");
  }
  return <div>HomePage</div>;
}

export default HomePage;
