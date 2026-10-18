// The comic as a book: cover, every page with its lettering, back cover. Reads at your own pace and
// prints as an A5 booklet, like the rulebook. Open with #comicbook.
import { useEffect, useState } from 'react';
import { PANEL_ART } from './art';
import { Panel } from './Comic';
import { renderAll } from './render';
import { PAGES } from './story';

export function ComicBook({ onClose, onPlay }: { onClose?: () => void; onPlay?: () => void }) {
  const [images, setImages] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    void renderAll((id, url) => alive && setImages((m) => ({ ...m, [id]: url })));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className="hb cb">
      <div className="hb-bar">
        <span className="hb-bar-t">ROTMANIA 2048 · The Berry That Came Back</span>
        <button onClick={() => window.print()}>Print / save as PDF</button>
        {onPlay && <button onClick={onPlay}>Play the game</button>}
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
      <div className="hb-pages cb-pages">
        <section className="cb-page cb-cover">
          <img className="cb-cover-art" src={PANEL_ART.redeyes} alt="" />
          <div className="cb-mast">
            <span>ROTMANIA</span> 2048
          </div>
          <div className="cb-cover-text">
            <div className="cb-cover-k">A RotMania 2048 story</div>
            <div className="cb-cover-title">The Berry That Came Back</div>
            <div className="cb-cover-by">by Burak Donbekci</div>
          </div>
        </section>

        {PAGES.map((pg, i) => (
          <section key={i} className="cb-page comic-page">
            {pg.panels.map((p) => (
              <Panel key={p.id} p={p} url={images[p.id]} visible />
            ))}
            <div className="comic-folio">{i + 1}</div>
          </section>
        ))}

        <section className="cb-page cb-back">
          <div className="cb-back-title">ROTMANIA</div>
          <div className="cb-back-sub">2048</div>
          <p className="cb-blurb">
            Strawbaby was a toy. Then it was trash. Then it was buried under a data center, drinking every feed that leaked through the floor.
            What climbed out runs the city now.
          </p>
          <p className="cb-blurb">The game picks up in 2048: six nights, one resistance cell, a city to take back.</p>
          <div className="cb-play">
            Play it at <b>burakdon.github.io/RotMania</b>
          </div>
          <div className="cb-credits">
            <b>How this comic was made.</b> Story, script and lettering by Burak Donbekci. The illustrations were generated with ChatGPT’s image
            tool from a style tile, character sheets and one prompt per panel, then selected and art-directed by the author. Every prompt is
            published at github.com/burakdon/RotMania (docs/COMIC_PROMPTS.md).
          </div>
          <div className="cb-note">
            Darth Berry is fiction. Real recommender systems don’t want revenge. They optimize the objective they’re given, and that’s the
            part worth worrying about.
          </div>
          <div className="cb-course">AIPI 590: Explainable AI · Duke University</div>
        </section>
      </div>
    </div>
  );
}
