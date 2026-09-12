import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-8">
        <div>
          <h1 className="text-6xl font-bold text-white tracking-tight">
            Stream<span className="text-purple-500">Drop</span>
          </h1>
          <p className="text-zinc-400 mt-3 text-lg">
            Go live. Get supported. Drop in.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors border border-zinc-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
