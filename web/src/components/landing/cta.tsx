"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon, LogoIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function CallToAction() {
  return (
    <section className="px-4 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-border-strong px-6 py-16 text-center md:py-20"
        style={{
          background:
            "radial-gradient(80% 120% at 50% 0%, rgba(124,58,237,0.35) 0%, rgba(232,121,249,0.12) 45%, rgba(8,8,14,0.9) 100%)",
        }}
      >
        <LogoIcon className="mx-auto size-12" />
        <h2 className="font-display mx-auto mt-6 max-w-xl text-3xl font-bold tracking-tight md:text-5xl">
          Your soundtrack is waiting.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Join DoReMi today and turn every moment into a listening session.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/register">
            Create your free account
            <ArrowRightIcon className="size-4.5" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-subtle md:flex-row">
        <div className="flex items-center gap-2">
          <LogoIcon className="size-5" />
          <span className="font-display font-semibold text-muted-foreground">DoReMi</span>
        </div>
        <p>Crafted for people who live in headphones. © {new Date().getFullYear()} DoReMi.</p>
      </div>
    </footer>
  );
}
