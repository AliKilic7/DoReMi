import type { Metadata } from "next";
import { CallToAction, LandingFooter } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { AlbumMarquee } from "@/components/landing/marquee";
import { LandingNavbar } from "@/components/landing/navbar";

export const metadata: Metadata = {
  title: "DoReMi — Music, tuned to you",
};

export default function LandingPage() {
  return (
    <div className="bg-mesh min-h-screen">
      <LandingNavbar />
      <main>
        <Hero />
        <AlbumMarquee />
        <Features />
        <CallToAction />
      </main>
      <LandingFooter />
    </div>
  );
}
