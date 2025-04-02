import { api } from "~/trpc/server";

async function HomePage() {
  const user = await api.auth.getProfile();
  console.log(user);
  return <div>HomePage</div>;
}

export default HomePage;
