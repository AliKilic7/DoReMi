import Link from "next/link";
import { LogoIcon } from "@/components/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-mesh relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute -top-20 right-[12%] size-96 rounded-full bg-primary-strong/20 blur-[130px]" />
        <div className="animate-float absolute bottom-[-10%] left-[8%] size-80 rounded-full bg-accent-cyan/10 blur-[110px] [animation-delay:-4s]" />
      </div>

      <Link
        href="/"
        className="focus-ring absolute top-6 left-6 flex items-center gap-2.5 rounded-lg"
      >
        <LogoIcon className="size-7" />
        <span className="font-display text-lg font-semibold tracking-tight">DoReMi</span>
      </Link>

      <main className="relative w-full max-w-105">{children}</main>
    </div>
  );
}
