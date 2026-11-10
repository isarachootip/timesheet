import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ChronoTrackLogo, ChronoTrackBrand } from './ChronoTrackLogo';

afterEach(() => {
  cleanup();
});

describe('ChronoTrackLogo & ChronoTrackBrand', () => {
  it('renders standalone ChronoTrackLogo SVG with requested size', () => {
    render(<ChronoTrackLogo size={36} />);
    const svg = screen.getByLabelText('CHRONOTRACK Logo');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('width')).toBe('36');
    expect(svg.getAttribute('height')).toBe('36');
  });

  it('renders ChronoTrackBrand (sm) as a bounded vector SVG lockup that fits inside the sidebar slot', () => {
    const { container } = render(<ChronoTrackBrand size="sm" />);
    const lockupSvg = screen.getByLabelText('CHRONOTRACK - PROJECT MANAGEMENT');
    expect(lockupSvg.tagName.toLowerCase()).toBe('svg');
    expect(lockupSvg.getAttribute('viewBox')).toBe('0 0 680 132');

    const titleEl = container.querySelector('[data-testid="brand-title"]');
    const subtitleEl = container.querySelector('[data-testid="brand-subtitle"]');
    expect(titleEl?.textContent).toBe('CHRONOTRACK');
    expect(subtitleEl?.textContent).toBe('PROJECT MANAGEMENT');

    const titleFontSize = parseFloat(titleEl?.getAttribute('font-size') ?? '0');
    const subtitleFontSize = parseFloat(subtitleEl?.getAttribute('font-size') ?? '0');
    expect(titleFontSize).toBeGreaterThan(subtitleFontSize * 2);
    expect(subtitleFontSize).toBeGreaterThanOrEqual(18);
  });

  it('renders ChronoTrackBrand (lg) centered for the login screen', () => {
    render(<ChronoTrackBrand size="lg" />);
    const lockupSvg = screen.getByLabelText('CHRONOTRACK - PROJECT MANAGEMENT');
    expect(lockupSvg.tagName.toLowerCase()).toBe('svg');
    expect((lockupSvg as HTMLElement).style.maxWidth).toBe('330px');
  });
});
