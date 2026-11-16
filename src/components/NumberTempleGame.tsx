'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Game, W, H } from '@/lib/game/engine';

export default function NumberTempleGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = new Game(canvas);
    gameRef.current = g;
    const onResize = (): void => g.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      g.destroy();
      gameRef.current = null;
    };
  }, []);

  // map pointer events to design coordinates
  const toDesign = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return { x, y };
  }, []);

  const handleDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const { x, y } = toDesign(e.clientX, e.clientY);
      gameRef.current?.onTap(x, y);
    },
    [toDesign]
  );

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-[#1a140a] p-0 select-none"
      style={{ touchAction: 'none' }}
    >
      <h1 className="sr-only">Number Temple Escape - a live playable numbers adventure game</h1>
      <div
        className="relative mx-auto my-auto overflow-hidden rounded-none sm:rounded-2xl sm:shadow-2xl sm:my-6"
        style={{
          height: 'min(100vh, 100dvh)',
          aspectRatio: `${W} / ${H}`,
          maxWidth: '100vw',
        }}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-pointer"
          onPointerDown={handleDown}
          aria-label="Number Temple Escape game canvas - tap to play"
          role="img"
        />
      </div>
    </main>
  );
}
