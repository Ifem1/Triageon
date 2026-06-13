"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
  pulseSpeed: number;
}

export function NodeGraph({ className, nodeColor = "0,223,129" }: { className?: string; nodeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const nodes: Node[] = [];
    const COUNT = 55;
    const MAX_DIST = 160;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    for (let i = 0; i < COUNT; i++) {
      nodes.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.8,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.018 + 0.008,
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w(), h());

      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.22;
            ctx.strokeStyle = `rgba(${nodeColor},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // nodes
      nodes.forEach((node) => {
        node.pulse += node.pulseSpeed;
        const pa = 0.45 + Math.sin(node.pulse) * 0.3;
        const pr = node.r + Math.sin(node.pulse) * 0.6;

        // glow halo
        const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, pr * 5);
        g.addColorStop(0, `rgba(${nodeColor},0.12)`);
        g.addColorStop(1, `rgba(${nodeColor},0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, pr * 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // node dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${nodeColor},${pa})`;
        ctx.fill();

        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > w()) node.vx *= -1;
        if (node.y < 0 || node.y > h()) node.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [nodeColor]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
