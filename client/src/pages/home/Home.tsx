import React from 'react';
import './home.css';

const Home: React.FC = () => (
  <main className="home-container">
    <header className="home-nav">
      <a className="home-brand" href="/" aria-label="Memory Chat home">
        <span className="home-logo">✦</span>
        <span>Memory Chat</span>
      </a>

      <nav className="home-nav-links" aria-label="Main navigation">
        <a href="/login">Sign In</a>
        <a className="home-nav-cta" href="/register">Create Account</a>
      </nav>
    </header>

    <section className="home-hero">
      <div className="home-glass-card">
        <span className="home-eyebrow">A conversation that remembers</span>
        <h1>Your ideas deserve a conversation that keeps up.</h1>
        <p>
          Meet your AI chat companion with memory. Pick up where you left off,
          keep your thoughts together, and make every conversation count.
        </p>
        <div className="home-actions">
          <a className="home-primary-button" href="/login">
            Start chatting <span aria-hidden="true">→</span>
          </a>
          <a className="home-secondary-button" href="/register">
            Create a free account
          </a>
        </div>
      </div>

      <div className="home-highlights" aria-label="Product highlights">
        <article className="home-highlight-card">
          <span className="home-highlight-icon" aria-hidden="true">✧</span>
          <h2>More continuity</h2>
          <p>Return to your conversations without starting from scratch.</p>
        </article>
        <article className="home-highlight-card">
          <span className="home-highlight-icon" aria-hidden="true">⌘</span>
          <h2>Your thoughts, together</h2>
          <p>Keep useful context close as ideas grow over time.</p>
        </article>
        <article className="home-highlight-card">
          <span className="home-highlight-icon" aria-hidden="true">✦</span>
          <h2>Made for exploring</h2>
          <p>Ask, brainstorm, and build on what you have already shared.</p>
        </article>
      </div>
    </section>

    <footer className="home-footer">
      © 2026 Memory Chat. All rights reserved.
    </footer>
  </main>
);

export default Home;
