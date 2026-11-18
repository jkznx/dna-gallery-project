import Link from "next/link";
export default function NotFound() { return <section className="status-page"><p className="eyebrow">404 / A missing connection</p><h1>This piece isn’t here.</h1><p>The link may have changed. Explore the collection to find another connection.</p><Link className="back-link" href="/">Return to the gallery →</Link></section>; }
