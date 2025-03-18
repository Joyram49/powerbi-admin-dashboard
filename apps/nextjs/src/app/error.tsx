"use client";
function GlobalErrorPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500">500</h1>
        <p className="text-2xl font-bold">Internal Server Error</p>
      </div>
    </div>
  );
}

export default GlobalErrorPage;
