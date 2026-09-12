import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Stream<span className="text-purple-500">Drop</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Create your streamer account
          </p>
        </div>
        <SignUp
          forceRedirectUrl="/streamer-dashboard"
          appearance={{
            elements: {
              card: "bg-zinc-900 border border-zinc-800 shadow-xl",
              headerTitle: "text-white",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton:
                "bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700",
              dividerLine: "bg-zinc-700",
              dividerText: "text-zinc-500",
              formFieldLabel: "text-zinc-300",
              formFieldInput:
                "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500",
              formButtonPrimary:
                "bg-purple-600 hover:bg-purple-700 text-white",
              footerActionLink: "text-purple-400 hover:text-purple-300",
            },
          }}
        />
      </div>
    </main>
  );
}
