import React, { useEffect, useRef } from 'react';

export default function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color definitions
    const COLOR_PRIMARY = 'rgba(37, 99, 235, 0.4)';  // Electric Blue
    const COLOR_GOLD = 'rgba(245, 158, 11, 0.45)';    // Gold Accent
    const COLOR_GLOW_BLUE = 'rgba(37, 99, 235, 0.8)';
    const COLOR_GLOW_GOLD = 'rgba(245, 158, 11, 0.9)';

    // Interfaces for animations
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      glowColor: string;
      isGold: boolean;
    }

    interface DataPacket {
      fromId: number;
      toId: number;
      progress: number;
      speed: number;
      color: string;
    }

    interface Bokeh {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
    }

    interface DiagonalFlow {
      pct: number;
      speed: number;
      width: number;
      alpha: number;
      size: number;
    }

    // 1. Initialize Network Nodes
    const nodes: Node[] = [];
    const nodeCount = Math.min(50, Math.floor((width * height) / 28000));

    for (let i = 0; i < nodeCount; i++) {
      const isGold = Math.random() > 0.75;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28, // slow drifting
        vy: (Math.random() - 0.5) * 0.28,
        radius: isGold ? Math.random() * 2 + 1.5 : Math.random() * 1.5 + 1.0,
        color: isGold ? COLOR_GOLD : COLOR_PRIMARY,
        glowColor: isGold ? COLOR_GLOW_GOLD : COLOR_GLOW_BLUE,
        isGold
      });
    }

    // 2. Data Transfer Packets setup
    const packets: DataPacket[] = [];
    const activeConnections: [number, number][] = [];

    const refreshConnections = () => {
      activeConnections.length = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 135) {
            activeConnections.push([i, j]);
          }
        }
      }
    };

    // Periodically push a few data packets
    const spawnPacket = () => {
      if (activeConnections.length === 0 || packets.length > 20) return; // Increased packet limit for rich flow
      // pick a random active line connection
      const pair = activeConnections[Math.floor(Math.random() * activeConnections.length)];
      if (!pair) return;
      const [from, to] = pair;
      packets.push({
        fromId: from,
        toId: to,
        progress: 0,
        speed: 0.007 + Math.random() * 0.015, // varying flow speeds
        color: Math.random() > 0.65 ? COLOR_GLOW_GOLD : COLOR_GLOW_BLUE
      });
    };

    // 3. Initialize Dark Blue Bokeh background particles
    const bokehs: Bokeh[] = [];
    const bokehCount = 14;
    for (let i = 0; i < bokehCount; i++) {
      bokehs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.08, // extremely slow bokeh drift
        vy: (Math.random() - 0.5) * 0.08,
        radius: Math.random() * 110 + 70, // beautiful large diffuse rings
        alpha: Math.random() * 0.04 + 0.015 // subtle glowing opacity
      });
    }

    // 4. Initialize Diagonal Flow beams (Bottom-Left to Top-Right)
    const diagonalFlows: DiagonalFlow[] = [];
    const diagonalFlowCount = 8;
    for (let i = 0; i < diagonalFlowCount; i++) {
      diagonalFlows.push({
        pct: Math.random(),
        speed: 0.0008 + Math.random() * 0.0018, // smooth continuous velocity
        width: (Math.random() - 0.5) * 200, // offset spread relative to center line
        alpha: 0.08 + Math.random() * 0.14,
        size: 1.8 + Math.random() * 2.5
      });
    }

    // Horizontal radar scanner sweep variable
    let radarY = 0;

    // 5. Setup World Map Coordinates for Dotted Hologram
    const continentPoints = [
      // North America
      [[15, 15], [30, 18], [25, 30], [20, 32], [10, 22]],
      // South America
      [[22, 35], [28, 42], [24, 60], [20, 62], [18, 50]],
      // Eurasia / Africa
      [[42, 12], [65, 10], [75, 18], [60, 35], [52, 45], [45, 32], [42, 22]],
      [[46, 36], [54, 38], [52, 58], [48, 62], [44, 45]],
      // Australia / East Asia
      [[68, 50], [74, 52], [71, 62], [66, 58]],
      [[65, 23], [70, 26], [68, 38]]
    ];

    let mapPulseGlow = 0;

    // Handle Window Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      refreshConnections();
    };

    window.addEventListener('resize', handleResize);
    refreshConnections();

    // Spawn packets interval-based (Faster spawning for a lively look)
    const intervalId = setInterval(spawnPacket, 400);

    // MAIN ANIMATION LOOP
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const time = Date.now();

      // Slow moving smooth background color accents (Dynamic radial gradients to simulate enterprise depth)
      const gradientL = ctx.createRadialGradient(
        width * 0.15, height * 0.45, 10,
        width * 0.15, height * 0.45, Math.min(width * 0.4, 500)
      );
      gradientL.addColorStop(0, 'rgba(37, 99, 235, 0.07)'); // soft electric blue
      gradientL.addColorStop(1, 'rgba(7, 11, 25, 0)');
      ctx.fillStyle = gradientL;
      ctx.fillRect(0, 0, width, height);

      const gradientR = ctx.createRadialGradient(
        width * 0.85, height * 0.5, 10,
        width * 0.85, height * 0.5, Math.min(width * 0.35, 450)
      );
      gradientR.addColorStop(0, 'rgba(245, 158, 11, 0.04)'); // soft gold accent glow
      gradientR.addColorStop(1, 'rgba(7, 11, 25, 0)');
      ctx.fillStyle = gradientR;
      ctx.fillRect(0, 0, width, height);

      // ==========================================
      // DRAW 0. SUBTLE DARK BLUE BOKEH IN THE BACKGROUND
      // ==========================================
      for (const b of bokehs) {
        ctx.beginPath();
        const baseColor = '37, 99, 235';
        const bokehGrad = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, b.radius);
        bokehGrad.addColorStop(0, `rgba(${baseColor}, ${b.alpha})`);
        bokehGrad.addColorStop(0.5, `rgba(${baseColor}, ${b.alpha * 0.4})`);
        bokehGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');

        ctx.fillStyle = bokehGrad;
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Slow bokeh movement drift
        b.x += b.vx;
        b.y += b.vy;

        // Dynamic viewport bounds wrap
        if (b.x < -b.radius) b.x = width + b.radius;
        if (b.x > width + b.radius) b.x = -b.radius;
        if (b.y < -b.radius) b.y = height + b.radius;
        if (b.y > height + b.radius) b.y = -b.radius;
      }

      // ==========================================
      // DRAW 1. HUD / WORLD MAP HOLOGRAM (LEFT AREA)
      // ==========================================
      const mapX = width * 0.15;
      const mapY = height * 0.45;
      const mapWidth = Math.min(width * 0.28, 380);
      const mapHeight = mapWidth * 0.65;

      // Pulse glow calculation every 5 seconds
      mapPulseGlow = 0.5 + 0.5 * Math.sin((time / 5000) * Math.PI * 2);
      const mapAlpha = 0.08 + mapPulseGlow * 0.12;

      ctx.save();
      ctx.translate(mapX - mapWidth / 2, mapY - mapHeight / 2);

      // Draw stylized tech grid lines
      ctx.strokeStyle = `rgba(37, 99, 235, ${mapAlpha * 0.5})`;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      // Latitude/Longitude Grid inside map bounds
      for (let g = 0; g <= 10; g++) {
        const hPct = g / 10;
        ctx.moveTo(0, mapHeight * hPct);
        ctx.lineTo(mapWidth, mapHeight * hPct);
        ctx.moveTo(mapWidth * hPct, 0);
        ctx.lineTo(mapWidth * hPct, mapHeight);
      }
      ctx.stroke();

      // Draw Continents as dotted matrix structures (Network Nodes map)
      ctx.fillStyle = `rgba(37, 99, 235, ${mapAlpha * 1.5})`;
      const dotSpacing = Math.max(6, Math.floor(mapWidth / 45));
      for (let xDot = 0; xDot < mapWidth; xDot += dotSpacing) {
        for (let yDot = 0; yDot < mapHeight; yDot += dotSpacing) {
          // Convert dot coordinate to percentage inside layout
          const px = (xDot / mapWidth) * 100;
          const py = (yDot / mapHeight) * 100;

          // Check if dot falls within any of our continent polygons (rough check)
          let isInside = false;
          for (const poly of continentPoints) {
            for (const pt of poly) {
              const dx = px - pt[0];
              const dy = py - pt[1];
              if (dx * dx + dy * dy < 72) {
                isInside = true;
                break;
              }
            }
            if (isInside) break;
          }

          if (isInside) {
            ctx.beginPath();
            // Pulse the dot sizes
            const size = 0.8 + 0.5 * Math.sin((time / 400) + xDot + yDot);
            ctx.arc(xDot, yDot, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw scanning circle rings in the background of map
      ctx.strokeStyle = `rgba(245, 158, 11, ${mapAlpha * 0.7})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mapWidth / 2, mapHeight / 2, mapWidth * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(37, 99, 235, ${mapAlpha * 0.85})`;
      ctx.setLineDash([4, 18]);
      ctx.beginPath();
      ctx.arc(mapWidth / 2, mapHeight / 2, mapWidth * 0.5, time * 0.0003, Math.PI * 2 + time * 0.0003);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Small targets and labels
      ctx.font = '8px monospace';
      ctx.fillStyle = `rgba(37, 99, 235, ${mapAlpha * 2})`;
      ctx.fillText('GLOBAL SYS MAP // SECURE', 10, -8);
      ctx.fillStyle = `rgba(245, 158, 11, ${mapAlpha * 2.2})`;
      ctx.fillText(`LATENCY: OK`, mapWidth - 75, -8);

      ctx.restore();


      // ==========================================
      // DRAW 2. FUTURISTIC SERVER RACKS (RIGHT AREA)
      // ==========================================
      const rackWidth = Math.min(width * 0.16, 170);
      const rackX = width - rackWidth - 40;
      const rackY = height * 0.18;
      const rackHeight = height * 0.65;

      ctx.save();
      // Draw outer server frame
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rackX, rackY, rackWidth, rackHeight);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)'; // server column shadow backing
      ctx.fillRect(rackX, rackY, rackWidth, rackHeight);

      // Draw shelf chassis elements (server servers)
      const numSlots = 9;
      const slotHeight = rackHeight / numSlots;
      for (let s = 0; s < numSlots; s++) {
        const sy = rackY + s * slotHeight;
        
        // Horizontal separators with metallic/glowing effect
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rackX, sy);
        ctx.lineTo(rackX + rackWidth, sy);
        ctx.stroke();

        // Server rack card inner elements
        ctx.fillStyle = 'rgba(37, 99, 235, 0.01)';
        ctx.fillRect(rackX + 4, sy + 3, rackWidth - 8, slotHeight - 6);

        // Grid fan pattern or technical slots
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.beginPath();
        for (let gx = rackX + 15; gx < rackX + rackWidth - 40; gx += 5) {
          ctx.moveTo(gx, sy + 6);
          ctx.lineTo(gx, sy + slotHeight - 6);
        }
        ctx.stroke();

        // 4-5 Small Blinking LEDs per unit
        const ledStartX = rackX + rackWidth - 45;
        for (let led = 0; led < 4; led++) {
          const lX = ledStartX + led * 8;
          const lY = sy + slotHeight / 2;

          // LED blink calculation: offset based on index and slot to generate beautiful organic pattern
          const blinkRate = 500 + s * 110 + led * 90;
          const trigger = Math.sin((time / blinkRate) * Math.PI) > 0.05;
          
          let ledColor = 'rgba(16, 185, 129, 0.15)'; // Default dim green
          if (trigger) {
            // randomly choose blue, gold, or green
            const choice = (s + led) % 3;
            if (choice === 0) {
              ledColor = 'rgba(16, 185, 129, 0.8)'; // bright green
            } else if (choice === 1) {
              ledColor = 'rgba(37, 99, 235, 0.85)'; // bright electric blue
            } else {
              ledColor = 'rgba(245, 158, 11, 0.85)'; // bright gold
            }
          }

          ctx.fillStyle = ledColor;
          ctx.beginPath();
          ctx.arc(lX, lY, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Tiny glowing ray for bright LED
          if (trigger) {
            ctx.fillStyle = ledColor.replace('0.85', '0.1').replace('0.8', '0.1');
            ctx.beginPath();
            ctx.arc(lX, lY, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw node line connection to actual network
        if (s === 2 || s === 5 || s === 7) {
          ctx.strokeStyle = 'rgba(37, 99, 235, 0.05)';
          ctx.beginPath();
          ctx.moveTo(rackX + 4, sy + slotHeight / 2);
          ctx.lineTo(rackX - 35, sy + slotHeight / 2);
          ctx.stroke();
        }
      }

      ctx.restore();


      // ==========================================
      // DRAW 3. JARING-JARING DIGITAL (NETWORK & CONNECTIVITY)
      // ==========================================
      ctx.lineWidth = 0.55;
      for (let i = 0; i < nodes.length; i++) {
        const p1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const p2 = nodes[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 135) {
            const baseO = (p1.isGold || p2.isGold) ? 0.14 : 0.08;
            const opacity = (1 - dist / 135) * baseO;
            ctx.strokeStyle = p1.isGold ? `rgba(245, 158, 11, ${opacity})` : `rgba(37, 99, 235, ${opacity})`;
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // ==========================================
      // DRAW 4. ACTIVE DATA PACKETS FLOW
      // ==========================================
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i];
        const fromNode = nodes[pk.fromId];
        const toNode = nodes[pk.toId];

        if (!fromNode || !toNode) {
          packets.splice(i, 1);
          continue;
        }

        // Increment packet progress
        pk.progress += pk.speed;

        if (pk.progress >= 1.0) {
          packets.splice(i, 1); // remove completed
          continue;
        }

        // Linear interpolation coordinates
        const curX = fromNode.x + (toNode.x - fromNode.x) * pk.progress;
        const curY = fromNode.y + (toNode.y - fromNode.y) * pk.progress;

        // Draw flowing packet (glowing sphere with tiny tail trailing behind)
        ctx.fillStyle = pk.color;
        ctx.beginPath();
        ctx.arc(curX, curY, 2.0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing spark aura
        ctx.fillStyle = pk.color.replace('0.9', '0.15').replace('0.8', '0.15');
        ctx.beginPath();
        ctx.arc(curX, curY, 5.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ==========================================
      // DRAW 5. FLOATING PARTICLES & NODES
      // ==========================================
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];

        // Draw actual particle point
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw delicate glowing halo ring
        ctx.fillStyle = p.isGold ? 'rgba(245, 158, 11, 0.05)' : 'rgba(37, 99, 235, 0.04)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Increment drift coordinates
        p.x += p.vx;
        p.y += p.vy;

        // Bouncing logic near borders
        if (p.x < 0 || p.x > width) p.vx = -p.vx;
        if (p.y < 0 || p.y > height) p.vy = -p.vy;
      }


      // ==========================================
      // DRAW 6. "DIGITAL FLOW" BEAMS (BOTTOM-LEFT TO TOP-RIGHT)
      // ==========================================
      const xStart = -50;
      const yStart = height + 50;
      const xEnd = width + 50;
      const yEnd = -50;

      for (const df of diagonalFlows) {
        df.pct += df.speed;
        if (df.pct > 1.0) {
          df.pct = 0;
          df.width = (Math.random() - 0.5) * 220;
          df.alpha = 0.08 + Math.random() * 0.14;
        }

        // Interpolated center path coordinates
        const bx = xStart + (xEnd - xStart) * df.pct;
        const by = yStart + (yEnd - yStart) * df.pct;

        // Orthogonal offset calculations to widen the flow pipeline
        const hyp = Math.sqrt(width * width + height * height);
        const ox = (height / hyp) * df.width;
        const oy = (width / hyp) * df.width;

        const px = bx + ox;
        const py = by + oy;

        // Glowing flow beam aura
        ctx.save();
        const flowGlow = ctx.createRadialGradient(px, py, 1, px, py, df.size * 15);
        flowGlow.addColorStop(0, `rgba(37, 99, 235, ${df.alpha})`);
        flowGlow.addColorStop(0.4, `rgba(37, 99, 235, ${df.alpha * 0.3})`);
        flowGlow.addColorStop(1, 'rgba(37, 99, 235, 0)');
        ctx.fillStyle = flowGlow;
        ctx.beginPath();
        ctx.arc(px, py, df.size * 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw the bright active data core point
        ctx.fillStyle = `rgba(37, 99, 235, ${df.alpha * 2.5})`;
        ctx.beginPath();
        ctx.arc(px, py, df.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }


      // ==========================================
      // DRAW 7. HORIZONTAL RADAR PULSE SWEEP
      // ==========================================
      radarY += 1.2; // sweep speed
      if (radarY > height) {
        radarY = 0;
      }

      ctx.save();
      // Scanner sweep body glow
      const scannerGlow = ctx.createLinearGradient(0, radarY - 20, 0, radarY + 20);
      scannerGlow.addColorStop(0, 'rgba(37, 99, 235, 0)');
      scannerGlow.addColorStop(0.5, 'rgba(37, 99, 235, 0.08)'); // very soft transparent sweep
      scannerGlow.addColorStop(1, 'rgba(37, 99, 235, 0)');
      ctx.fillStyle = scannerGlow;
      ctx.fillRect(0, radarY - 20, width, 40);

      // Thinner, brighter light core indicating scan active
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, radarY);
      ctx.lineTo(width, radarY);
      ctx.stroke();
      ctx.restore();


      // ==========================================
      // DRAW 8. ENERGY RING AT THE BOTTOM
      // ==========================================
      const ringX = width / 2;
      const ringY = height - 42;
      const ringRadX = width * 0.45;
      const ringRadY = 32;

      ctx.save();
      ctx.translate(ringX, ringY);
      
      // Thin glowing track base
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadX, ringRadY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Dashed spinning energy streak 1 (Clockwise)
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
      ctx.setLineDash([45, 180]);
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadX, ringRadY, 0, time * 0.00018, Math.PI * 2 + time * 0.00018);
      ctx.stroke();

      // Dashed spinning energy streak 2 (Counter-Clockwise in Amber/Gold)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.13)';
      ctx.setLineDash([15, 120]);
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadX * 0.96, ringRadY * 0.9, 0, -time * 0.00028, Math.PI * 2 - time * 0.00028);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.restore();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
