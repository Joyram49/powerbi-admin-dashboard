export default function HomePage() {
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

  // const activeUsers = await api.user.getAllActiveUsers();
  // console.log(">>> active users", activeUsers);

  // const reports = await api.report.getAllReports({
  //   searched: "",
  //   limit: 5,
  //   page: 2,
  // });
  // console.log(">>> reports", reports);

  // const adminReports = await api.report.getAllReportsAdmin();
  // console.log(">>> admin reports", adminReports);

  // const userReports = await api.report.getAllReportsUser();
  // console.log(">>> user reports", userReports);

  // const allCompanies = await api.company.getAllActiveCompanies({
  //   limit: 10,
  //   page: 1,
  // });
  // console.log(">>> all active companies", allCompanies);

  return (
    <main className="container h-screen px-4 py-0">
      <div className="flex h-full flex-col items-center justify-center">
        <div>Welcome to Home page.</div>
      </div>
    </main>
  );
}
