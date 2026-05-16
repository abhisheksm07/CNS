import { useMemo } from "react";

export default function ParticleField({ count = 70 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        tx: `${(Math.random() - 0.5) * 180}px`,
        ty: `${(Math.random() - 0.5) * 180}px`,
        dur: `${5 + Math.random() * 8}s`,
        size: 1 + Math.random() * 3
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="particle absolute rounded-full bg-cyanline shadow-neon"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            "--tx": particle.tx,
            "--ty": particle.ty,
            "--dur": particle.dur
          }}
        />
      ))}
    </div>
  );
}
