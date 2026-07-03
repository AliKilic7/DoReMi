"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  HeartIcon,
  PauseIcon,
  SkipNextIcon,
  SkipPrevIcon,
  WaveIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** Floating glass mock of the player — pure decoration, no audio. */
function HeroPlayerCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong mx-auto w-full max-w-md rounded-3xl p-5 shadow-[0_32px_80px_-24px_rgba(124,58,237,0.45)]"
      aria-hidden
    >
      <div className="flex items-center gap-4">
        <div
          className="size-16 shrink-0 rounded-2xl"
          style={{ background: "linear-gradient(135deg,#7c3aed 0%,#e879f9 60%,#22d3ee 100%)" }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">Midnight Arcade</p>
          <p className="truncate text-sm text-muted-foreground">Neon Harbor</p>
        </div>
        <HeartIcon filled className="size-5 text-accent-pink" />
      </div>

      <div className="mt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-pink"
            initial={{ width: "18%" }}
            animate={{ width: "72%" }}
            transition={{ duration: 14, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-subtle">
          <span>2:41</span>
          <span>3:56</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6">
        <SkipPrevIcon className="size-5 text-muted-foreground" />
        <span className="flex size-11 items-center justify-center rounded-full bg-white text-background shadow-lg">
          <PauseIcon className="size-4.5" />
        </span>
        <SkipNextIcon className="size-5 text-muted-foreground" />
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-40 pb-24 md:pt-48">
      {/* ambient animated blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float absolute -top-24 left-[8%] size-105 rounded-full bg-primary-strong/25 blur-[120px]" />
        <div className="animate-float absolute top-40 right-[4%] size-80 rounded-full bg-accent-pink/16 blur-[110px] [animation-delay:-3s]" />
        <div className="animate-float absolute bottom-0 left-[38%] size-72 rounded-full bg-accent-cyan/12 blur-[100px] [animation-delay:-5s]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 lg:flex-row lg:gap-10">
        <div className="max-w-xl text-center lg:text-left">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground lg:mx-0"
          >
            <WaveIcon className="size-4 text-primary-soft" />
            Lossless-ready streaming, reimagined
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="font-display mt-6 text-5xl leading-[1.05] font-bold tracking-tight md:text-7xl"
          >
            Music, tuned
            <br />
            <span className="text-gradient">to you.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="mt-6 text-lg text-muted-foreground"
          >
            Millions of moods, one home. Build playlists, follow artists you love and let DoReMi
            score every moment of your day — on any device, beautifully.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <Button asChild size="lg">
              <Link href="/register">
                Start listening free
                <ArrowRightIcon className="size-4.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">I already have an account</Link>
            </Button>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.4}
            className="mt-5 text-xs text-subtle"
          >
            Free forever · No credit card · Cancel anytime
          </motion.p>
        </div>

        <div className="w-full flex-1">
          <HeroPlayerCard />
        </div>
      </div>
    </section>
  );
}
