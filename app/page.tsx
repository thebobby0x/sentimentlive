import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-rosa">sentimentLive</h1>
        <p className="mt-2 text-sm text-[#9b8f95]">Real-time attendee sentiment · studio0x</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/demo"
          className="rounded-lg bg-riptide px-6 py-3 font-semibold text-noir hover:bg-riptide/85 transition-colors"
        >
          IMEX Demo
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-noir-600 px-6 py-3 font-semibold text-[#f4eef1] hover:border-riptide/50 transition-colors"
        >
          Live Dashboard
        </Link>
      </div>
    </main>
  );
}
