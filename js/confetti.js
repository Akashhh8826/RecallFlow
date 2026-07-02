/**
 * RecallFlow Canvas Confetti Celebration System
 * Renders high-performance dynamic confetti particles to celebrate focus milestones.
 */

class ConfettiManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrameId = null;
        this.colors = [
            '#8b5cf6', // Purple
            '#06b6d4', // Cyan
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#ef4444', // Rose
            '#ec4899'  // Pink
        ];
    }

    init() {
        if (this.canvas) return;

        // Find or create canvas
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'confetti-canvas';
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '9999';
            document.body.appendChild(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth * window.devicePixelRatio;
            this.canvas.height = window.innerHeight * window.devicePixelRatio;
            if (this.ctx) {
                this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            }
        }
    }

    // Spawn a burst of confetti particles
    burst(particleCount = 120) {
        this.init();
        if (!this.canvas || !this.ctx) return;

        const now = Date.now();
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight + 10;

        for (let i = 0; i < particleCount; i++) {
            // Random velocities
            const angle = Math.PI / 4 + Math.random() * (Math.PI / 2); // angle between 45 and 135 deg
            const speed = 8 + Math.random() * 12;
            const vx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
            const vy = -Math.sin(angle) * speed - 5; // Launch upwards

            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: -20 - (Math.random() * 100), // Start above screen for continuous rain, or at center
                vx: vx * 0.5,
                vy: Math.abs(vy) * 0.4 + 2, // gravity fallback
                width: 6 + Math.random() * 8,
                height: 10 + Math.random() * 10,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: -4 + Math.random() * 8,
                opacity: 1,
                decay: 0.005 + Math.random() * 0.015
            });
        }

        // Add side fountains
        this.spawnFountain(20, startY, 45, 60);  // Left side fountain
        this.spawnFountain(window.innerWidth - 20, startY, 135, 60); // Right side fountain

        if (!this.animationFrameId) {
            this.animate();
        }
    }

    spawnFountain(x, y, baseAngleDeg, count) {
        const rad = (baseAngleDeg * Math.PI) / 180;
        for (let i = 0; i < count; i++) {
            const spreadAngle = rad + (Math.random() * 0.4 - 0.2); // +/- 11 degrees
            const speed = 15 + Math.random() * 15;
            const vx = Math.cos(spreadAngle) * speed;
            const vy = -Math.sin(spreadAngle) * speed;

            this.particles.push({
                x: x,
                y: y - 50,
                vx: vx,
                vy: vy,
                width: 5 + Math.random() * 7,
                height: 8 + Math.random() * 8,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: -8 + Math.random() * 16,
                opacity: 1,
                decay: 0.008 + Math.random() * 0.01
            });
        }
    }

    animate() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Apply gravity and drag
            p.vy += 0.35; // Gravity
            p.vx *= 0.98; // Air resistance
            p.vy *= 0.98;

            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.opacity -= p.decay;

            // Remove out-of-bounds or faded particles
            if (p.y > window.innerHeight + 20 || p.x < -20 || p.x > window.innerWidth + 20 || p.opacity <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            // Draw particle
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;

            // Draw rectangle shape
            this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.animationFrameId = null;
        }
    }
}

// Global Instantiate
window.confettiManager = new ConfettiManager();
