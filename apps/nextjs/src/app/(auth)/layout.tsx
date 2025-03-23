import React from "react";
import Image from "next/image";

import AuthFooter from "./_components/auth_footer";

function AuthLayout(props: { children: React.ReactNode }) {
  return (
    <main className="container flex h-screen flex-col justify-between px-4 py-0">
      <div className="relative mt-4 flex flex-1 flex-col items-center justify-center">
        <Image
          src="/joc-logo-color.png"
          alt="logo"
          width={200}
          height={200}
          className="absolute top-0 mx-auto"
        />
        {props.children}
      </div>
      <AuthFooter />
    </main>
  );
}

export default AuthLayout;
