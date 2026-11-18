"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="status-page" role="alert"><h1>A connection slipped.</h1><p>The collection could not load. Please try again.</p><button onClick={reset}>Try again</button></section>; }
