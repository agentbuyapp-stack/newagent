import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe('Footer Component', () => {
  it('renders footer correctly', () => {
    render(<Footer />);

    // Check if AgentBuy text exists
    expect(screen.getByText('AgentBuy')).toBeInTheDocument();
  });

  it('contains description text', () => {
    render(<Footer />);

    // Check for description
    expect(screen.getByText(/Хятадаас бараа захиалах/)).toBeInTheDocument();
  });

  it('displays powered by text', () => {
    render(<Footer />);

    expect(screen.getByText(/DARKHAN BUSIIN CARGO/)).toBeInTheDocument();
  });

  it('contains social media links', () => {
    render(<Footer />);

    // Check for social links (Facebook, YouTube, etc)
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('displays copyright text', () => {
    render(<Footer />);

    expect(screen.getByText(/AgentBuy. Бүх эрх хуулиар хамгаалагдсан/)).toBeInTheDocument();
  });

  it('contains contact information', () => {
    render(<Footer />);

    // Check for phone number
    expect(screen.getByText('+976 8520-5258')).toBeInTheDocument();
  });
});
