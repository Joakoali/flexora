import { getDictionary } from "./dictionaries";

export default async function HomePage() {
  const dict = await getDictionary();
  return (
    <main id="main" className="container-site section">
      <h1 className="display">Flexora</h1>
      <p className="measure">{dict.hero.tagline}</p>
    </main>
  );
}
