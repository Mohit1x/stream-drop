import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Globe, Shield, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <Image src="/assets/logo.png" alt="StreamDrop" width={110} height={32} priority />
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">

        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-violet-500/8 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-fuchsia-500/8 rounded-full blur-[80px]" />
        </div>

        {/* Badge */}
        <div className="relative mb-6 inline-flex items-center gap-2 border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Now live — Real-time superchats for streamers
        </div>

        {/* Headline */}
        <h1 className="relative text-center font-bold tracking-tight leading-[1.08]" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}>
          The easiest way to
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
            monetize your stream
          </span>
        </h1>

        <p className="relative mt-6 text-center text-zinc-400 max-w-xl leading-relaxed" style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}>
          StreamDrop lets your audience send superchats directly to your stream — no platform cuts, instant payouts, live on your OBS overlay.
        </p>

        {/* CTAs */}
        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/40"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 text-white font-semibold px-7 py-3.5 rounded-xl transition-all"
          >
            Sign in
          </Link>
        </div>

        {/* Video placeholder */}
        <div className="relative mt-16 w-full max-w-4xl">
          {/* Glow behind video */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-fuchsia-600/20 to-violet-600/30 rounded-2xl blur-xl" />
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center">
            {/* Black box placeholder for video */}
            <div className="absolute inset-0 bg-zinc-950" />
            <div className="relative flex flex-col items-center gap-3 text-zinc-600">
              <div className="w-14 h-14 rounded-full border-2 border-zinc-700 flex items-center justify-center">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-zinc-600 ml-1" />
              </div>
              <span className="text-sm">Video coming soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/[0.02] py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "₹0", label: "Platform fees" },
            { value: "<1s", label: "Superchat delivery" },
            { value: "OBS", label: "Native overlay" },
            { value: "100%", label: "Yours to keep" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-zinc-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-purple-400 font-medium mb-4">Why StreamDrop</p>
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-16">Everything you need to go live</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Zap className="w-5 h-5 text-purple-400" />,
                title: "Real-time superchats",
                desc: "Donations appear on your stream overlay instantly via Pusher websockets.",
              },
              {
                icon: <Globe className="w-5 h-5 text-purple-400" />,
                title: "YouTube integration",
                desc: "Connect your YouTube channel and auto-import your live stream in one click.",
              },
              {
                icon: <Shield className="w-5 h-5 text-purple-400" />,
                title: "Secure payments",
                desc: "Powered by Razorpay — PCI-compliant, verified, and battle-tested.",
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
                title: "Live analytics",
                desc: "Track total streams, donations, and earnings right from your dashboard.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 flex flex-col gap-4 hover:border-purple-500/30 hover:bg-white/[0.05] transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">{f.title}</p>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-purple-400 font-medium mb-4">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-16">Live in three steps</h2>
          <div className="flex flex-col sm:flex-row items-start gap-8">
            {[
              { step: "01", title: "Create your stream", desc: "Connect YouTube or set up manually in under a minute." },
              { step: "02", title: "Share your link", desc: "Send your public stream URL to your audience." },
              { step: "03", title: "Receive superchats", desc: "Watch donations appear live on your OBS overlay in real time." },
            ].map((s, i) => (
              <div key={s.step} className="flex-1 flex flex-col items-center text-center gap-3 relative">
                {i < 2 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(50%+2rem)] right-0 h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
                )}
                <div className="w-10 h-10 rounded-full border border-purple-500/40 bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold">
                  {s.step}
                </div>
                <p className="font-semibold text-white">{s.title}</p>
                <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/15 to-violet-600/20 rounded-3xl blur-2xl" />
          <div className="relative border border-white/10 bg-white/[0.03] rounded-3xl px-8 py-16 text-center flex flex-col items-center gap-6">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to drop in?</h2>
            <p className="text-zinc-400 max-w-md leading-relaxed">
              Join streamers already using StreamDrop to connect with their audience and get supported in real time.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/40 text-base"
            >
              Get started for free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Image src="/assets/logo.png" alt="StreamDrop" width={90} height={26} />
        <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} StreamDrop. All rights reserved.</p>
        <div className="flex items-center gap-6 text-zinc-600 text-sm">
          <Link href="/sign-in" className="hover:text-zinc-400 transition-colors">Sign In</Link>
          <Link href="/sign-up" className="hover:text-zinc-400 transition-colors">Sign Up</Link>
        </div>
      </footer>

    </main>
  );
}
