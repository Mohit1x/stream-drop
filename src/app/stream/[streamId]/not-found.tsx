export default function StreamNotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center flex flex-col gap-3">
        <h1 className="text-2xl font-bold">Stream Not Found</h1>
        <p className="text-muted-foreground text-sm">
          This stream doesn't exist or is no longer available.
        </p>
      </div>
    </main>
  );
}
