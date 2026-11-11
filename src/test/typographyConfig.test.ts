import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Global Typography & Font Comfort Configuration', () => {
  it('loads Inter, Anuphan, and logo fonts via non-blocking <link> in index.html', () => {
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
    expect(html).toContain('family=Anuphan');
    expect(html).toContain('family=Inter');
    expect(html).toContain('family=Outfit');
    expect(html).toContain('display=swap');
  });

  it('configures --font-sans with Inter + Anuphan, comfortable 15px base scale, and tabular-nums in index.css', () => {
    const css = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf-8');
    expect(css).not.toMatch(/^@import\s+url\(/m);
    expect(css).toContain("--font-sans: 'Inter', 'Anuphan'");
    expect(css).toContain('--fs-base: 0.9375rem');
    expect(css).toMatch(/body\s*\{[\s\S]*?font-family:\s*var\(--font-sans\)/);
    expect(css).toMatch(/body\s*\{[\s\S]*?line-height:\s*1\.6/);
    expect(css).toContain('font-variant-numeric: tabular-nums');
    expect(css).toContain('font-family: inherit');
  });

  it('applies --font-sans to ChatWidget while preserving ChronoTrackBrand luxury logo fonts', () => {
    const chatWidget = fs.readFileSync(
      path.join(rootDir, 'src/components/ChatWidget.tsx'),
      'utf-8'
    );
    const logo = fs.readFileSync(
      path.join(rootDir, 'src/components/ChronoTrackLogo.tsx'),
      'utf-8'
    );

    expect(chatWidget).toContain("fontFamily: 'var(--font-sans)'");
    expect(logo).toContain("'Outfit'");
    expect(logo).toContain("'Plus Jakarta Sans'");
  });
});
