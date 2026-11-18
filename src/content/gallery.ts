/** Replace this adapter when the owner confirms a publishing workflow.
 * Only approved public artwork should ever be returned by a future adapter.
 * These are original, generated sample compositions, not the user's artwork.
 */
export type Artwork = Readonly<{
  id: string; sortOrder: number;
  slug: string; title: string; description: string; alt: string;
  image: string; width: number; height: number; medium: string;
}>;

const fixtures: readonly Artwork[] = [
  { id: "sample-001", sortOrder: 1, slug: "soft-orbit", title: "Soft orbit", description: "A study of circles finding their own rhythm. Original sample composition for layout review.", alt: "Lavender rings surrounding a pale yellow disc on a warm cream field", image: "/samples/soft-orbit.png", width: 1200, height: 1500, medium: "Digital study · Sample 01" },
  { id: "sample-002", sortOrder: 2, slug: "in-between", title: "In between", description: "Two shapes, a little space, and a conversation in color. Original sample composition for layout review.", alt: "Two curved lavender forms separated by a slender cream passage", image: "/samples/in-between.png", width: 1200, height: 1500, medium: "Digital study · Sample 02" },
  { id: "sample-003", sortOrder: 3, slug: "daylight", title: "Daylight", description: "A bright interruption in a quiet afternoon. Original sample composition for layout review.", alt: "A yellow sun rising over layered plum and lavender hills", image: "/samples/daylight.png", width: 1200, height: 1500, medium: "Digital study · Sample 03" },
  { id: "sample-004", sortOrder: 4, slug: "little-waves", title: "Little waves", description: "Repetition with room for a small surprise. Original sample composition for layout review.", alt: "A sequence of flowing plum waves across a lavender background", image: "/samples/little-waves.png", width: 1200, height: 1500, medium: "Digital study · Sample 04" },
  { id: "sample-005", sortOrder: 5, slug: "growing-room", title: "Growing room", description: "A botanical gesture drawn from simple shapes. Original sample composition for layout review.", alt: "An abstract plum stem with yellow and lavender leaves on cream", image: "/samples/growing-room.png", width: 1200, height: 1500, medium: "Digital study · Sample 05" },
  { id: "sample-006", sortOrder: 6, slug: "afterglow", title: "Afterglow", description: "The last warm light, held in a small frame. Original sample composition for layout review.", alt: "Concentric lavender and yellow arches set against a dark plum field", image: "/samples/afterglow.png", width: 1200, height: 1500, medium: "Digital study · Sample 06" }
];

export async function listArtworks(): Promise<readonly Artwork[]> {
  return [...fixtures].sort((a, b) => a.sortOrder - b.sortOrder);
}
export async function getArtwork(slug: string): Promise<Artwork | undefined> {
  return fixtures.find((artwork) => artwork.slug === slug);
}
