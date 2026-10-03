"use client";

import { useRef } from "react";

export function TiltCard({
  holo,
  max = 14,
  touch = false,
  onClick,
  label,
  className = "",
  children,
}: {
  holo: boolean;
  max?: number;
  /** Also follow finger drags on touch screens (used for the opened card). */
  touch?: boolean;
  onClick?: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function move(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "touch" && !touch) return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * max * 2}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * max * 2}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.dataset.active = "true";
  }

  function leave() {
    const el = ref.current!;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.dataset.active = "false";
  }

  return (
    <div className="tilt-scene">
      <button
        ref={ref}
        onClick={onClick}
        onPointerMove={move}
        onPointerLeave={leave}
        onPointerUp={(e) => e.pointerType === "touch" && leave()}
        onPointerCancel={leave}
        aria-label={label}
        data-active="false"
        className={`tilt block aspect-[5/7] w-full overflow-hidden rounded-xl bg-surface ${touch ? "tilt-touch" : ""} ${className}`}
      >
        {children}
        {holo && <span className="holo" aria-hidden />}
        <span className="glare" aria-hidden />
      </button>
    </div>
  );
}
