import AuthFooter from "./_components/auth_footer";
import SignInPage from "./login/page";

function AuthLayout() {
  return (
    <main className="container h-screen px-4 py-0">
      <div className="flex h-full flex-col items-center justify-center">
        <SignInPage />
        <AuthFooter />
      </div>
    </main>
  );
}

export default AuthLayout;
