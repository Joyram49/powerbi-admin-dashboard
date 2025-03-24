import { api } from "~/trpc/server";

export default async function HomePage() {
  // const supabase = createClientServer();
  // const user = await supabase.auth.getUser();
  // console.log(user);

  // const user = await api.report.printHello();
  const user = await api.user.getAllUsers();
  console.log(">>> user from report router", user);
  return (
    <main className="container h-screen px-4 py-0">
      <div className="flex h-full flex-col items-center justify-center">
        <div>Welcome to Home page.</div>
      </div>
    </main>
  );
}
