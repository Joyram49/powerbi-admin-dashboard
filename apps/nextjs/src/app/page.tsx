import { api } from "~/trpc/server";

export default async function HomePage() {
  // const supabase = createClientServer();
  // const user = await supabase.auth.getUser();
  // console.log(">>> user information", user);

  // const user = await api.user.getUserById({
  //   userId: "3813bcaf-99d1-4852-9ebf-fdb456c2aadf",
  // });

  // console.log(">>> user from home page", user);

  // const users: User[] = await api.user.getAllUsers();
  // console.log(">>> all users ", users);

  // const adminUsers = await api.user.getAdminUsers();
  // console.log(">>> admin users", adminUsers);

  const reports = await api.report.getAllReports();
  console.log(">>> reports", reports);

  return (
    <main className="container h-screen px-4 py-0">
      <div className="flex h-full flex-col items-center justify-center">
        <div>Welcome to Home page.</div>
      </div>
    </main>
  );
}
