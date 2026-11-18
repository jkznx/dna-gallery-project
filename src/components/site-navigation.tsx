"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNavigation() {
  const pathname = usePathname();
  const infoActive = pathname === "/info" || pathname.startsWith("/info/");
  const savedActive = pathname === "/saved";

  return <nav className="site-navigation" aria-label="Main navigation">
    <Link href="/gallery" aria-current={!infoActive && !savedActive ? "page" : undefined}>Gallery</Link>
    <Link href="/saved" aria-current={savedActive ? "page" : undefined}>Saved</Link>
    <Link href="/info" aria-current={infoActive ? "page" : undefined}>Info</Link>
  </nav>;
}
