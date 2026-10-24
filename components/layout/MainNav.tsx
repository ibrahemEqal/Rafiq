"use client";
import { Link, usePathname } from "@/i18n/routing";
import {
  Sun,
  Users,
  Backpack,
  LibraryBig,
  BookOpen,
  MessageCircleQuestion,
  HandHelping,
} from "lucide-react";
const links = [
  ["/companion", "companion", Sun],
  ["/circles", "circles", Users],
  ["/study", "study", Backpack],
  ["/resources", "resources", LibraryBig],
  ["/books", "books", BookOpen],
  ["/questions", "questions", MessageCircleQuestion],
  ["/requests", "requests", HandHelping],
] as const;
export default function MainNav({
  labels,
  compact = false,
}: {
  labels: Record<string, string>;
  compact?: boolean;
}) {
  const path = usePathname();
  return (
    <nav
      aria-label={labels.mobileNavigation}
      className={
        compact
          ? "flex items-center gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex items-center gap-0.5"
      }
    >
      {links.map(([href, label, Icon]) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-bold transition ${active ? "bg-[#e4eddb] text-[#264c36]" : "text-slate-500 hover:bg-[#f2f5ed] hover:text-[#264c36]"}`}
          >
            <Icon size={14} aria-hidden="true" />
            {labels[label]}
          </Link>
        );
      })}
    </nav>
  );
}
