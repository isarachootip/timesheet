import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Global Design System, Typography & Theme Configuration', () => {
  it('loads only Inter and Anuphan fonts in index.html without external chat widget script', () => {
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
    expect(html).toContain('family=Anuphan');
    expect(html).toContain('family=Inter');
    expect(html).not.toContain('family=Outfit');
    expect(html).not.toContain('Plus+Jakarta+Sans');
    expect(html).toContain('display=swap');
    expect(html).toContain('<title>ChronoTrack — Project Management</title>');
    expect(html).not.toContain('/widget.js');
  });

  it('defines Light default + Charcoal Dark tokens, single accent, 6 font sizes (>=12px), and no neon/blur in tokens.css', () => {
    const tokens = fs.readFileSync(path.join(rootDir, 'src/styles/tokens.css'), 'utf-8');
    expect(tokens).toContain("--font-sans: 'Inter', 'Anuphan'");
    expect(tokens).toContain('--bg-primary: #F8FAFC');
    expect(tokens).toContain('--accent-primary: #2563EB');
    expect(tokens).toContain('[data-theme="dark"]');
    expect(tokens).toContain('--bg-primary: #0F1218');
    expect(tokens).toContain('--accent-primary: #3B82F6');
    expect(tokens).toContain('--fs-12: 12px');
    expect(tokens).toContain('--fs-13: 13px');
    expect(tokens).toContain('--fs-14: 14px');
    expect(tokens).toContain('--fs-16: 16px');
    expect(tokens).toContain('--fs-20: 20px');
    expect(tokens).toContain('--fs-28: 28px');
    expect(tokens).not.toContain('#00F5FF');
    expect(tokens).not.toContain('#D946EF');
    expect(tokens).not.toContain('--shadow-glow');
  });

  it('removes backdrop-filter blur and body background-attachment fixed from layout and component stylesheets', () => {
    const css = [
      fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf-8'),
      fs.readFileSync(path.join(rootDir, 'src/styles/layout.css'), 'utf-8'),
      fs.readFileSync(path.join(rootDir, 'src/styles/components.css'), 'utf-8'),
    ].join('\n');

    expect(css).not.toMatch(/backdrop-filter\s*:\s*blur/i);
    expect(css).not.toContain('background-attachment: fixed');
    expect(css).toContain('font-variant-numeric: tabular-nums');
    expect(css).not.toContain('pulse-badge');
  });

  it('applies --font-sans to ChatWidget and removes Outfit/Plus Jakarta Sans from ChronoTrackLogo', () => {
    const chatWidget = fs.readFileSync(
      path.join(rootDir, 'src/components/ChatWidget.tsx'),
      'utf-8'
    );
    const logo = fs.readFileSync(
      path.join(rootDir, 'src/components/ChronoTrackLogo.tsx'),
      'utf-8'
    );

    expect(chatWidget).toContain("fontFamily: 'var(--font-sans)'");
    expect(logo).not.toContain('Outfit');
    expect(logo).not.toContain('Plus Jakarta Sans');
  });
});
