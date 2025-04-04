import React from "react";

import AuthFooter from "./_components/auth_footer";

function AuthLayout(props: { children: React.ReactNode }) {
  return (
    <main className="container h-screen px-4 py-0">
      <div className="flex h-full flex-col items-center justify-center">
        {props.children}
        <AuthFooter />
      </div>
    </main>
  );
}

export default AuthLayout;
