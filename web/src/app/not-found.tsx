import Link from "next/link";
import { LogoIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <LogoIcon className="size-12 opacity-80" />
      <p className="font-display text-gradient text-7xl font-bold">404</p>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">This track doesn&apos;t exist</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for was moved, deleted, or never made it past the demo tape.
        </p>
      </div>
      <Button asChild>
        <Link href="/home">Back to the music</Link>
      </Button>
    </div>
  );
}
