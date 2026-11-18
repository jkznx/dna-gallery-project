import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { listArtworks, getArtwork } from "../src/content/gallery.ts";

test("sample content has unique safe routes and complete local image metadata", async () => {
  const artworks = await listArtworks();
  assert.equal(artworks.length, 6);
  assert.equal(new Set(artworks.map((artwork) => artwork.slug)).size, artworks.length);
  assert.equal(new Set(artworks.map((artwork) => artwork.id)).size, artworks.length);
  assert.deepEqual(artworks.map((artwork) => artwork.sortOrder), [1, 2, 3, 4, 5, 6]);
  for (const artwork of artworks) {
    assert.match(artwork.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(artwork.alt.trim().length > 20);
    assert.ok(artwork.id.trim().length > 0);
    assert.ok(artwork.title.trim().length > 0 && artwork.description.trim().length > 0);
    assert.ok(Number.isInteger(artwork.width) && artwork.width > 0);
    assert.ok(Number.isInteger(artwork.height) && artwork.height > 0);
    assert.ok(artwork.image.startsWith("/samples/"));
    assert.ok(existsSync(join(process.cwd(), "public", artwork.image)));
    assert.equal((await getArtwork(artwork.slug))?.title, artwork.title);
  }
});
test("unknown slugs cannot resolve an artwork", async () => {
  assert.equal(await getArtwork("missing"), undefined);
  assert.equal(await getArtwork("../../private"), undefined);
});
