import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { ThemeToggle } from "@acme/ui/theme";

import { api } from "~/trpc/server";
import { CustomTrigger } from "./sidebar-trigger";

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
        <div className="flex items-center justify-center gap-x-4 justify-self-start">
          <CustomTrigger />
          <h1 className="hidden text-xl font-semibold dark:text-white lg:block">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <div>
            <p className="hidden font-medium text-slate-800 dark:text-white md:block">
              {userMetadata.email}
            </p>
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
