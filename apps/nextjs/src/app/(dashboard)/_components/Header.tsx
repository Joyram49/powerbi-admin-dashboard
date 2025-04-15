import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { ThemeToggle } from "@acme/ui/theme";

import { api } from "~/trpc/server";
import { CustomTrigger } from "./SidebarTrigger";

interface UserMetadata {
  firstLetter?: string;
  profileImage?: string;
  email?: string;
  userName: string;
}

export default async function Header() {
  const { user } = await api.auth.getProfile();
  if (!user) {
    // Return minimal header for logged out state
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
          </div>
        </div>
      </header>
    );
  }
  if (user.id && typeof user.user_metadata.userName === "string") {
    const userMetadata: UserMetadata = {
      userName: user.user_metadata.userName,
      profileImage: user.user_metadata.profileImage as string,
      email: user.user_metadata.email as string,
      firstLetter: user.user_metadata.userName.charAt(0),
    };
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
                {userMetadata.userName}
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
}
