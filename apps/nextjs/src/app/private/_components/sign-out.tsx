"use client";

import { Button } from "@acme/ui/button";

import { api } from "~/trpc/react";

function SignOutBtn() {
  const signOut = api.auth.signOut.useMutation();
  const handleClick = () => {
    signOut.mutate(undefined, {
      onError: (error) => {
        console.log("Signout error", error);
      },
      onSuccess: (result) => {
        console.log("successfully signout", result);
      },
    });
  };

  return <Button onClick={handleClick}>SignOutBtn</Button>;
}

export default SignOutBtn;
