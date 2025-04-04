function AuthFooter() {
  return (
    <footer className="flex h-16 w-full flex-col items-center space-y-4 bg-inherit px-4 sm:flex-row sm:justify-between sm:space-y-0">
      <div className="">
        <h1 className="text-lg font-medium">Footer Icon</h1>
      </div>
      <div>
        <p>
          All rights reserved{" "}
          <span className="font-medium">&copy;JOC Analytics,</span>
        </p>
      </div>
    </footer>
  );
}

export default AuthFooter;
