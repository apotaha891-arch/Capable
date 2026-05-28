import { ImageResponse } from 'next/og';
import { fetchBlueprintBySlug } from '@/lib/api';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };

// Fetch a TTF from Google Fonts (satori cannot parse woff2). Requesting with an
// older UA makes Google serve a TTF URL we can then download as an ArrayBuffer.
async function loadGoogleFont(family, text) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36' },
  })).text();
  const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/);
  if (!src) throw new Error('No TTF in Google font CSS');
  const res = await fetch(src[1]);
  if (!res.ok) throw new Error(`Font download ${res.status}`);
  return res.arrayBuffer();
}

export async function GET(req, { params }) {
  let data = null;
  try {
    data = await fetchBlueprintBySlug(params.slug, { revalidate: 60 });
  } catch {
    /* default card */
  }

  const bp = data?.blueprint;
  const hero = bp?.blocks?.find(b => b.type === 'HeroSection')?.content;
  const title = bp?.project_name || 'Capable';
  const subtitle = hero?.subtitle || 'Built with Capable';
  const primary = bp?.theme?.primary_color || '#1e40af';
  const secondary = bp?.theme?.secondary_color || '#f59e0b';
  const isRtl = bp?.direction === 'rtl';

  const card = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        color: 'white',
        padding: 80,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
      <div style={{ fontSize: 36, marginTop: 24, opacity: 0.9 }}>{subtitle}</div>
    </div>
  );

  try {
    const fontFamily = isRtl ? 'Cairo' : 'Inter';
    const fontData = await loadGoogleFont(fontFamily, `${title} ${subtitle}`);
    return new ImageResponse(card, {
      ...size,
      fonts: [{ name: fontFamily, data: fontData, style: 'normal', weight: 700 }],
    });
  } catch {
    // Last-resort: latin-only title with satori's bundled font — never 500.
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            color: 'white',
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          {/^[\x00-\x7F\s]*$/.test(title) ? title : 'Capable'}
        </div>
      ),
      size
    );
  }
}
