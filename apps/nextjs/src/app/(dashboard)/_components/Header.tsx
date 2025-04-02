import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { ThemeToggle } from "@acme/ui/theme";

import { api } from "~/trpc/server";

interface UserMetadata {
  firstLetter: string | null;
  profileImage: string | null;
  email: string | null;
}

export default async function Header() {
  const { user } = await api.auth.getProfile();
  const userMetadata: UserMetadata = user.user_metadata;
  if (user.id && typeof user.user_metadata.userName === "string") {
    userMetadata.firstLetter = user.user_metadata.userName.charAt(0);
    userMetadata.profileImage = user.user_metadata.profileImage as string;
    userMetadata.email = user.user_metadata.email as string;
  }
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-xl font-semibold dark:text-white">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div>
            <p className="font-medium text-slate-800">{userMetadata.email}</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={userMetadata.profileImage} />
            <AvatarFallback className="bg-blue-500 font-medium text-white">
              {userMetadata.firstLetter
                ? userMetadata.firstLetter.toUpperCase()
                : "UNO"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
