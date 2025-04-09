"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { User } from "@acme/db";
import { Button } from "@acme/ui/button";

import { api } from "~/trpc/react";

function SignOutBtn() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const signOut = api.auth.signOut.useMutation();
  const updateUser = api.user.updateUser.useMutation();
  const { data, isSuccess } = api.user.getUserById.useQuery({
    userId: "39fe321c-abf7-499e-b16d-69ca09cf84fb",
  });

  useEffect(() => {
    if (isSuccess) {
      setUser(data.user);
    }
  }, [isSuccess, data]);

  const handleClick = () => {
    signOut.mutate(undefined, {
      onError: (error) => {
        console.log("Signout error", error);
      },
      onSuccess: (result) => {
        router.push("/login");
      },
    });
  };

  const handleUpdateUser = () => {
    updateUser.mutate(
      {
        userId: "39fe321c-abf7-499e-b16d-69ca09cf84fb",
        userName: "testusertwo",
      },
      {
        onError: (error) => {
          console.log("Update user error", error);
        },
        onSuccess: () => {
          router.refresh();
        },
      },
    );
  };

  return (
    <div>
      <Button onClick={handleClick}>SignOutBtn</Button>
      <Button onClick={handleUpdateUser}>UpdateUser</Button>
    </div>
  );
}

export default SignOutBtn;
