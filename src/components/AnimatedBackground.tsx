import React from 'react';

/**
 * AnimatedBackground — Decorative emerald glow particles + diagonal gradient
 *
 * IPHONE SAFARI VIEWPORT FIX (Feb 2026):
 * - Changed from `absolute inset-0` to `fixed inset-0` so the background is
 *   pinned to the viewport and does NOT reflow when iOS Safari's address bar
 *   shows/hides (which changes `dvh` dynamically).
 * - Uses `100svh` (small viewport height) as the primary height, which is the
 *   viewport height with the address bar VISIBLE — the smallest stable value.
 *   Falls back to `100vh` for browsers that don't support `svh`.
 * - `pointer-events-none` + `z-0` keeps it behind all interactive content.
 * - Consumer pages must have `relative z-10` (or higher) on their content
 *   wrapper to paint above this fixed layer.
 *
 * Tested: iPhone X Safari, iPhone 14/15 Safari, Android Chrome, Desktop.
 */
const AnimatedBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{
        /* 100svh = viewport with address bar visible (stable, never changes).
           Fallback: 100vh for browsers without svh support. */
        height: '100svh',
        minHeight: '100vh',
      }}
    >
      <div className="absolute inset-0">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-emerald-500/10 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/5 via-transparent to-emerald-800/5" />
    </div>
  );
};

export default AnimatedBackground;
