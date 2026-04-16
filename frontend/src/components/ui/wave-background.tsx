import { useEffect, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';

interface Point {
  x: number;
  y: number;
  wave: { x: number; y: number };
  cursor: { x: number; y: number; vx: number; vy: number };
}

interface WavesProps {
  className?: string;
  strokeColor?: string;
  backgroundColor?: string;
  pointerSize?: number;
}

export function Waves({
  className = '',
  strokeColor = '#ffffff',
  backgroundColor = '#000000',
  pointerSize = 0.5,
}: WavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const mouseRef     = useRef({ x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false });
  const pathsRef     = useRef<SVGPathElement[]>([]);
  const linesRef     = useRef<Point[][]>([]);
  const noiseRef     = useRef<((x: number, y: number) => number) | null>(null);
  const rafRef       = useRef<number | null>(null);
  const boundingRef  = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    noiseRef.current = createNoise2D();
    setSize();
    setLines();

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('touchmove', onTouchMove, { passive: false });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      containerRef.current?.removeEventListener('touchmove', onTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSize = () => {
    if (!containerRef.current || !svgRef.current) return;
    boundingRef.current = containerRef.current.getBoundingClientRect();
    const { width, height } = boundingRef.current;
    svgRef.current.style.width  = `${width}px`;
    svgRef.current.style.height = `${height}px`;
  };

  const setLines = () => {
    if (!svgRef.current || !boundingRef.current) return;
    const { width, height } = boundingRef.current;
    linesRef.current = [];
    pathsRef.current.forEach(p => p.remove());
    pathsRef.current = [];

    const xGap = 8;
    const yGap = 8;
    const oWidth  = width  + 200;
    const oHeight = height + 30;
    const totalLines  = Math.ceil(oWidth  / xGap);
    const totalPoints = Math.ceil(oHeight / yGap);
    const xStart = (width  - xGap * totalLines)  / 2;
    const yStart = (height - yGap * totalPoints) / 2;

    for (let i = 0; i < totalLines; i++) {
      const points: Point[] = [];
      for (let j = 0; j < totalPoints; j++) {
        points.push({
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wave:   { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        });
      }
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill',         'none');
      path.setAttribute('stroke',       strokeColor);
      path.setAttribute('stroke-width', '1');
      svgRef.current.appendChild(path);
      pathsRef.current.push(path);
      linesRef.current.push(points);
    }
  };

  const onResize    = () => { setSize(); setLines(); };
  const onMouseMove = (e: MouseEvent) => updateMousePosition(e.pageX, e.pageY);
  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
  };

  const updateMousePosition = (x: number, y: number) => {
    if (!boundingRef.current) return;
    const m = mouseRef.current;
    m.x = x - boundingRef.current.left;
    m.y = y - boundingRef.current.top + window.scrollY;
    if (!m.set) { m.sx = m.x; m.sy = m.y; m.lx = m.x; m.ly = m.y; m.set = true; }
    containerRef.current?.style.setProperty('--x', `${m.sx}px`);
    containerRef.current?.style.setProperty('--y', `${m.sy}px`);
  };

  const movePoints = (time: number) => {
    const noise = noiseRef.current;
    if (!noise) return;
    linesRef.current.forEach(points => {
      points.forEach(p => {
        const move = noise((p.x + time * 0.008) * 0.003, (p.y + time * 0.003) * 0.002) * 8;
        p.wave.x = Math.cos(move) * 12;
        p.wave.y = Math.sin(move) * 6;

        const m  = mouseRef.current;
        const dx = p.x - m.sx;
        const dy = p.y - m.sy;
        const d  = Math.hypot(dx, dy);
        const l  = Math.max(175, m.vs);
        if (d < l) {
          const s = 1 - d / l;
          const f = Math.cos(d * 0.001) * s;
          p.cursor.vx += Math.cos(m.a) * f * l * m.vs * 0.00035;
          p.cursor.vy += Math.sin(m.a) * f * l * m.vs * 0.00035;
        }
        p.cursor.vx += (0 - p.cursor.x) * 0.01;
        p.cursor.vy += (0 - p.cursor.y) * 0.01;
        p.cursor.vx *= 0.95;
        p.cursor.vy *= 0.95;
        p.cursor.x  += p.cursor.vx;
        p.cursor.y  += p.cursor.vy;
        p.cursor.x   = Math.min(50, Math.max(-50, p.cursor.x));
        p.cursor.y   = Math.min(50, Math.max(-50, p.cursor.y));
      });
    });
  };

  const moved = (point: Point, withCursor = true) => ({
    x: point.x + point.wave.x + (withCursor ? point.cursor.x : 0),
    y: point.y + point.wave.y + (withCursor ? point.cursor.y : 0),
  });

  const drawLines = () => {
    linesRef.current.forEach((points, i) => {
      if (points.length < 2 || !pathsRef.current[i]) return;
      const first = moved(points[0], false);
      let d = `M ${first.x} ${first.y}`;
      for (let j = 1; j < points.length; j++) {
        const c = moved(points[j]);
        d += ` L ${c.x} ${c.y}`;
      }
      pathsRef.current[i].setAttribute('d', d);
    });
  };

  const tick = (time: number) => {
    const m  = mouseRef.current;
    m.sx += (m.x - m.sx) * 0.1;
    m.sy += (m.y - m.sy) * 0.1;
    const dx = m.x - m.lx;
    const dy = m.y - m.ly;
    m.v  = Math.hypot(dx, dy);
    m.vs += (m.v - m.vs) * 0.1;
    m.vs  = Math.min(100, m.vs);
    m.lx  = m.x;
    m.ly  = m.y;
    m.a   = Math.atan2(dy, dx);
    containerRef.current?.style.setProperty('--x', `${m.sx}px`);
    containerRef.current?.style.setProperty('--y', `${m.sy}px`);
    movePoints(time);
    drawLines();
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor,
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        ['--x' as string]: '-0.5rem',
        ['--y' as string]: '50%',
      }}
    >
      <svg ref={svgRef} className="block w-full h-full" xmlns="http://www.w3.org/2000/svg" />
      <div
        style={{
          position: 'absolute', top: 0, left: 0,
          width:  `${pointerSize}rem`,
          height: `${pointerSize}rem`,
          background:    strokeColor,
          borderRadius:  '50%',
          transform:     'translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)',
          willChange:    'transform',
        }}
      />
    </div>
  );
}
