"use client";

import { Button } from "@acme/ui/button";

import { api } from "~/trpc/react";

function UpdateCompanyBtn() {
  const updateCompany = api.company.updateCompany.useMutation();

  const handleUpdateCompany = () => {
    updateCompany.mutate(
      {
        companyId: "6bee008d-f918-4615-8a94-752d4493fe1e",
        companyName: "Update company four",
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            console.log(result);
          }
        },
        onError: (error) => {
          console.log(error);
        },
      },
    );
  };

  return <Button onClick={handleUpdateCompany}>UpdateCom</Button>;
}

export default UpdateCompanyBtn;
