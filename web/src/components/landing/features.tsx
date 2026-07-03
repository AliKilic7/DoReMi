"use client";

import { motion } from "framer-motion";
import {
  DevicesIcon,
  DownloadIcon,
  HeartIcon,
  QueueIcon,
  SearchIcon,
  SparklesIcon,
} from "@/components/icons";
import type { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: <SparklesIcon className="size-5" />,
    title: "Made-for-you mixes",
    description: "Daily recommendations that actually get your taste, powered by your listening.",
  },
  {
    icon: <QueueIcon className="size-5" />,
    title: "Limitless playlists",
    description: "Create, reorder and share playlists with covers that match your vibe.",
  },
  {
    icon: <SearchIcon className="size-5" />,
    title: "Instant search",
    description: "Find any song, album or artist in milliseconds — typos welcome.",
  },
  {
    icon: <HeartIcon className="size-5" />,
    title: "Your liked universe",
    description: "One heart keeps every favorite safe, synced and ready to replay.",
  },
  {
    icon: <DevicesIcon className="size-5" />,
    title: "Every device",
    description: "Pick up where you left off — desktop, tablet or phone, seamlessly.",
  },
  {
    icon: <DownloadIcon className="size-5" />,
    title: "Studio quality",
    description: "Choose your fidelity, from data-saver to lossless-ready streaming.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
            Everything a listening room <span className="text-gradient">should be</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            DoReMi wraps a serious music library in an interface that feels effortless.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="glass group rounded-2xl p-6 transition-colors duration-300 hover:border-primary/35 hover:bg-white/6"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary-soft transition-transform duration-300 group-hover:scale-110">
                {feature.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
