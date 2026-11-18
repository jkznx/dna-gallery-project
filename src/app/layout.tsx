import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { SiteNavigation } from "@/components/site-navigation";
import "./globals.css";
import "../components/helix-motion.css";
import "../components/dna-ladder.css";
import "../components/traveling-dna.css";
import "../components/site-navigation.css";
import "../components/artwork-connections.css";
import "../components/discovery.css";
import "../components/helix3d.css";

const montserrat = localFont({ src: "../fonts/Montserrat.ttf", variable: "--font-body", weight: "100 900", display: "swap" });
const caveat = localFont({ src: "../fonts/Caveat.ttf", variable: "--font-accent", weight: "400 700", display: "swap" });

export const metadata: Metadata = { title: { default: "DNA — A shared thread", template: "%s · DNA" }, description: "Six studies in form and feeling, connected through a moving DNA gallery.", robots: { index: false, follow: false } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${montserrat.variable} ${caveat.variable}`}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><Link className="wordmark" href="/gallery" aria-label="DNA gallery home">dna<span aria-hidden="true">✳</span></Link><span className="header-caption">A collection of connections.</span><SiteNavigation/></header>
    <main id="main" tabIndex={-1}>{children}</main>
    <footer className="site-footer"><Link className="wordmark" href="/gallery">dna<span aria-hidden="true">✳</span></Link><p>A collection of connections.</p><a href="#main">Back to top ↑</a></footer>
  </body></html>;
}

