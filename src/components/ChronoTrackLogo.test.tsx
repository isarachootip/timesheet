import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ChronoTrackLogo, ChronoTrackBrand } from './ChronoTrackLogo';

afterEach(() => {
  cleanup();
});

describe('ChronoTrackLogo & ChronoTrackBrand', () => {
  it('renders standalone ChronoTrackLogo with Lucide icon mark', () => {
    render(<ChronoTrackLogo size={36} />);
    const logo = screen.getByLabelText('ChronoTrack Logo');
    expect(logo).toBeTruthy();
  });

  it('renders ChronoTrackBrand (sm) in Title Case using clean typography without gradients', () => {
    const { container } = render(<ChronoTrackBrand size="sm" />);
    const titleEl = container.querySelector('[data-testid="brand-title"]');
    const subtitleEl = container.querySelector('[data-testid="brand-subtitle"]');
    expect(titleEl?.textContent).toBe('ChronoTrack');
    expect(subtitleEl?.textContent).toBe('Project Management');
    expect(container.innerHTML).not.toContain('linearGradient');
  });

  it('renders ChronoTrackBrand (lg) centered for the login screen', () => {
    const { container } = render(<ChronoTrackBrand size="lg" />);
    const titleEl = container.querySelector('[data-testid="brand-title"]');
    expect(titleEl?.textContent).toBe('ChronoTrack');
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.justifyContent).toBe('center');
  });
});
