import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ChronoTrackLogo, ChronoTrackBrand } from './ChronoTrackLogo';

afterEach(() => {
  cleanup();
});

describe('ChronoTrackLogo & ChronoTrackBrand', () => {
  it('renders standalone ChronoTrackLogo with the custom chronograph SVG emblem', () => {
    const { container } = render(<ChronoTrackLogo size={36} />);
    const logo = screen.getByLabelText('CHRONOTRACK Logo');
    expect(logo.tagName.toLowerCase()).toBe('svg');
    expect(container.querySelectorAll('linearGradient').length).toBeGreaterThanOrEqual(2);
  });

  it('renders ChronoTrackBrand (sm) with bold CHRONOTRACK wordmark and high-contrast PROJECT MANAGEMENT subtitle', () => {
    const { container } = render(<ChronoTrackBrand size="sm" />);
    const titleEl = container.querySelector('[data-testid="brand-title"]');
    const subtitleEl = container.querySelector('[data-testid="brand-subtitle"]');
    expect(titleEl?.textContent).toBe('CHRONOTRACK');
    expect(subtitleEl?.textContent).toBe('PROJECT MANAGEMENT');
    expect(titleEl?.getAttribute('font-family')).toBe('var(--font-sans)');
    expect(titleEl?.getAttribute('font-weight')).toBe('700');
    expect(subtitleEl?.getAttribute('font-weight')).toBe('700');
    expect(Number(subtitleEl?.getAttribute('font-size'))).toBeGreaterThanOrEqual(24);
    expect(subtitleEl?.getAttribute('fill')).toBe('var(--brand-subtitle, var(--text-primary))');
  });

  it('renders ChronoTrackBrand (lg) centered for the login screen', () => {
    const { container } = render(<ChronoTrackBrand size="lg" />);
    const titleEl = container.querySelector('[data-testid="brand-title"]');
    expect(titleEl?.textContent).toBe('CHRONOTRACK');
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.justifyContent).toBe('center');
  });
});
