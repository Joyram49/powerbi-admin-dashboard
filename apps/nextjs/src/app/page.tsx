import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container h-screen px-4 py-0">
      <div className="flex h-full flex-col items-center justify-center">
        <div>Welcome to Home page</div>
        <Link href="/dashboard" className="text-blue-500 underline">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
