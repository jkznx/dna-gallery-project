import Link from "next/link";

export function StudySearch({ query = "", concept }: { query?: string; concept?: string }) {
  return <div className="study-search-row"><form className="study-search" action="/connections" method="get" role="search">
    <label htmlFor="study-search-input">Find a study</label>
    <div className="study-search-fields"><input id="study-search-input" name="q" type="search" maxLength={120} defaultValue={query} placeholder="Try yellow, curves, or daylight"/>{concept && <input type="hidden" name="concept" value={concept}/>}<button type="submit">Search</button></div>
  </form><Link className="saved-shortcut" href="/saved">Your saved studies <span aria-hidden="true">↗</span></Link></div>;
}
