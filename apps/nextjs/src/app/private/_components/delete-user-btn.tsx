"use client";

import { useRouter } from "next/navigation";

import { Button } from "@acme/ui/button";

import { api } from "~/trpc/react";

function DeleteUserBtn() {
  const router = useRouter();
  const deleteUser = api.user.deleteUser.useMutation();
  const handleClick = () => {
    deleteUser.mutate(
      {
        userId: "0b3af948-85a9-436f-806b-bc10579b7b87",
        modifiedBy: "e077a6fc-f563-4006-8505-029fd3b357ac",
        role: "superAdmin",
      },

      {
        onError: (error) => {
          console.log("Signout error", error);
        },
        onSuccess: () => {
          router.push("/login");
        },
      },
    );
  };

  return (
    <div>
      <Button onClick={handleClick}>DeleteUserBtn</Button>
    </div>
  );
}

export default DeleteUserBtn;
