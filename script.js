const init = () => {
    // Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    // --- Lenis Smooth Scroll ---
    const lenis = new Lenis({ smoothWheel: true });

    // Update ScrollTrigger on Lenis scroll
    lenis.on('scroll', ScrollTrigger.update);

    // Sync Lenis with GSAP ticker
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Refresh ScrollTrigger after all assets load
    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });

    // Pause Lenis when terminal input is focused so keyboard events reach it
    document.addEventListener('focusin', (e) => {
        if (e.target && e.target.id === 'terminal-input') lenis.stop();
    });
    document.addEventListener('focusout', (e) => {
        if (e.target && e.target.id === 'terminal-input') lenis.start();
    });

    // --- Theme Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('portfolio-theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            document.body.classList.toggle('dark-theme');

            if (document.body.classList.contains('light-theme')) {
                localStorage.setItem('portfolio-theme', 'light');
            } else {
                localStorage.setItem('portfolio-theme', 'dark');
            }
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // --- Cinematic Preloader ---
    const preloader = document.getElementById('preloader');
    const loaderProgress = document.querySelector('.loader-progress');
    const loaderBinary = document.querySelector('.loader-binary');

    const binaryInterval = setInterval(() => {
        loaderBinary.textContent = Array.from({ length: 40 }, () => Math.round(Math.random())).join("");
    }, 50);

    const tlPreloader = gsap.timeline({
        onComplete: () => {
            clearInterval(binaryInterval);
            gsap.to(preloader, { opacity: 0, duration: 1, onComplete: () => preloader.style.display = 'none' });
            initHeroAnimations();
        }
    });

    tlPreloader.to(loaderProgress, { width: '100%', duration: 2.5, ease: "power2.inOut" })
        .to('.loader-text', { text: "SYSTEMS ONLINE", duration: 0.5 });


    function initHeroAnimations() {
        const tl = gsap.timeline();
        tl.from('.badge', { y: -20, opacity: 0, duration: 0.8 })
            .to('.hero-content h1', { duration: 0.1, onComplete: () => decryptText(document.querySelector('.hero-content h1')) })
            .to('.tagline', { duration: 0.1, onComplete: () => decryptText(document.querySelector('.tagline')) }, "+=0.2")
            .from('.tagline', { y: 20, opacity: 0, duration: 0.8 }, "<")
            .from('.hero-actions', { y: 20, opacity: 0, duration: 0.8 }, "-=0.6")
            .from('.image-wrapper', { scale: 0.9, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=1");
    }

    // --- Living Portrait Interaction (Static) ---
    const imageWrapper = document.querySelector('.image-wrapper');
    const profileImg = document.querySelector('.profile-img');

    // The user requested to remove the photo's reaction to the mouse pointer.
    // The image now remains static while maintaining the entrance animation.

    // --- Neural Canvas (Background) ---
    const bkgCanvas = document.getElementById('neural-canvas');
    if (bkgCanvas) {
        const ctx = bkgCanvas.getContext('2d');
        let particles = [];
        let streams = [];
        let shockwaves = [];
        let mouse = { x: null, y: null };
        const layers = 3;

        const resize = () => {
            bkgCanvas.width = window.innerWidth;
            bkgCanvas.height = window.innerHeight;
            initParticles();
            initStreams();
        };
        window.addEventListener('resize', resize);

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        window.addEventListener('click', (e) => {
            shockwaves.push({ x: e.clientX, y: e.clientY, radius: 0, maxRadius: 300, life: 1 });
        });

        class Particle {
            constructor(layer) {
                this.layer = layer;
                this.init();
            }
            init() {
                this.x = Math.random() * bkgCanvas.width;
                this.y = Math.random() * bkgCanvas.height;
                const speedMult = (this.layer + 1) * 0.2;
                this.vx = (Math.random() - 0.5) * speedMult;
                this.vy = (Math.random() - 0.5) * speedMult;
                this.radius = (this.layer + 1) * 0.8;
                this.alpha = (this.layer + 1) * 0.15;
            }
            update() {
                shockwaves.forEach(sw => {
                    const dx = this.x - sw.x;
                    const dy = this.y - sw.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < sw.radius && dist > sw.radius - 20) {
                        const force = (1 - dist / sw.maxRadius) * 10;
                        this.x += (dx / dist) * force;
                        this.y += (dy / dist) * force;
                    }
                });
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0) this.x = bkgCanvas.width;
                if (this.x > bkgCanvas.width) this.x = 0;
                if (this.y < 0) this.y = bkgCanvas.height;
                if (this.y > bkgCanvas.height) this.y = 0;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59, 130, 246, ${this.alpha})`;
                ctx.fill();
            }
        }

        class DataStream {
            constructor() {
                this.init();
            }
            init() {
                this.x = Math.random() * bkgCanvas.width;
                this.y = -Math.random() * bkgCanvas.height;
                this.speed = Math.random() * 2 + 1;
                this.length = Math.floor(Math.random() * 15) + 5;
            }
            update() {
                this.y += this.speed + (lenis.velocity * 0.1);
                if (this.y > bkgCanvas.height) this.init();
            }
            draw() {
                ctx.font = "10px monospace";
                ctx.fillStyle = "rgba(0, 255, 65, 0.15)";
                for (let i = 0; i < this.length; i++) {
                    const char = Math.random() > 0.9 ? "1" : "0";
                    ctx.fillText(char, this.x, this.y - (i * 12));
                }
            }
        }

        function initParticles() {
            particles = [];
            const count = window.innerWidth < 768 ? 40 : 100;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(i % layers));
            }
        }
        function initStreams() {
            streams = [];
            const count = Math.floor(bkgCanvas.width / 50);
            for (let i = 0; i < count; i++) {
                streams.push(new DataStream());
            }
        }
        resize();

        function animateCanvas() {
            ctx.clearRect(0, 0, bkgCanvas.width, bkgCanvas.height);
            shockwaves = shockwaves.filter(sw => { sw.radius += 10; sw.life -= 0.02; return sw.life > 0; });
            streams.forEach(s => { s.update(); s.draw(); });
            particles.forEach((p, i) => {
                p.update(); p.draw();
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    if (Math.abs(p.layer - p2.layer) <= 1) {
                        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                        const maxDist = 150 + (p.layer * 50);
                        if (dist < maxDist) {
                            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
                            const alpha = (0.2 * (1 - dist / maxDist)) * ((p.layer + 1) / layers);
                            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
                            ctx.lineWidth = 0.5; ctx.stroke();
                        }
                    }
                }
                if (mouse.x && p.layer === 2) {
                    const mDist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
                    if (mDist < 200) {
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.4 * (1 - mDist / 200)})`;
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(animateCanvas);
        };
        animateCanvas();
    }

    // --- Spotlight & Kinetic 3D Hover Cards ---
    document.querySelectorAll('.project-card, .bento-large, .bento-small, .bento-third, .stat-card, .skill-category, .timeline-item, .cert-card, .contact-content').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Spotlight
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // 3D Tilt Math
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg tilt
            const rotateY = ((x - centerX) / centerX) * 5;

            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                transformPerspective: 1000,
                ease: "power2.out",
                duration: 0.4
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                ease: "elastic.out(1, 0.3)",
                duration: 1.2
            });
        });
    });

    // --- Advanced Scroll Animations ---
    // Staggered Reveal for Cards
    const sections = document.querySelectorAll('section');
    sections.forEach(sec => {
        const cards = sec.querySelectorAll('.project-card, .stat-card, .skill-category, .timeline-item, .cert-card');
        if (cards.length > 0) {
            gsap.from(cards, {
                scrollTrigger: {
                    trigger: sec,
                    start: "top 80%",
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "back.out(1.7)"
            });
        }
    });

    // --- Magnetic Interactions ---
    const magneticElements = document.querySelectorAll('.btn, .logo, .theme-toggle, .social-links a, .nav-links a');
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(el, { x: x * 0.4, y: y * 0.4, duration: 0.4, ease: "power2.out" });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
        });
    });

    // --- Interactive Mouse Trail & Cyber Cursor ---
    const cyberCursor = document.querySelector('.cyber-cursor');
    const cyberCursorDot = document.querySelector('.cyber-cursor-dot');

    document.addEventListener('mousemove', (e) => {
        // Move Cyber Cursor
        if (cyberCursor && cyberCursorDot) {
            cyberCursor.style.transform = `translate3d(${e.clientX - 25}px, ${e.clientY - 25}px, 0)`;
            cyberCursorDot.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;

            // Lock-on logic is handled by css transform, so we just update pos here
            if (cyberCursor.classList.contains('lock-on')) {
                cyberCursor.style.transform = `translate3d(${e.clientX - 25}px, ${e.clientY - 25}px, 0) scale(0.6) rotate(45deg)`;
            }
        }

        const trail = document.createElement('div');
        trail.className = 'trail-particle';
        trail.style.left = e.clientX + 'px'; trail.style.top = e.clientY + 'px';
        document.body.appendChild(trail);
        gsap.to(trail, { y: (Math.random() - 0.5) * 100, x: (Math.random() - 0.5) * 100, opacity: 0, scale: 0.1, duration: 1, onComplete: () => trail.remove() });
    });

    // Cyber Cursor Hover Lock-on
    const clickables = document.querySelectorAll('a, button, .project-card, .timeline-item, input, textarea');
    clickables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (cyberCursor) cyberCursor.classList.add('lock-on');
            if (cyberCursorDot) cyberCursorDot.classList.add('lock-on');
        });
        el.addEventListener('mouseleave', () => {
            if (cyberCursor) cyberCursor.classList.remove('lock-on');
            if (cyberCursorDot) cyberCursorDot.classList.remove('lock-on');
        });
    });

    // --- Text Decryption Engine ---
    function decryptText(element) {
        if (!element) return;
        const originalText = element.textContent;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let iterations = 0;

        element.classList.add('decrypting');

        const interval = setInterval(() => {
            element.textContent = originalText.split("").map((char, index) => {
                if (index < iterations) return originalText[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join("");
            if (iterations >= originalText.length) {
                clearInterval(interval);
                element.classList.remove('decrypting');
            }
            iterations += 1 / 3;
        }, 30);
    }

    gsap.utils.toArray('h2').forEach(heading => {
        ScrollTrigger.create({ trigger: heading, start: "top 90%", onEnter: () => decryptText(heading), once: true });
    });

    // --- Terminal Interactive ---
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalBody = document.getElementById('terminal-body');

    if (terminalInput && terminalOutput) {
        const commandHistory = [];

        function appendLine(html) {
            const div = document.createElement('div');
            div.className = 'terminal-line';
            div.innerHTML = html;
            terminalOutput.appendChild(div);
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }

        function printLine(inputText, responseHTML) {
            appendLine(`<span class="prompt">&gt; ${inputText}</span>`);
            appendLine(`<span class="output">${responseHTML}</span>`);
        }

        function printAsync(inputText, lines, delay = 80) {
            appendLine(`<span class="prompt">&gt; ${inputText}</span>`);
            lines.forEach((text, i) => {
                setTimeout(() => {
                    appendLine(`<span class="output">${text}</span>`);
                }, i * delay);
            });
        }

        function handleCommand(raw) {
            const input = raw.toLowerCase().trim();
            if (!input) return;
            commandHistory.push(input);

            // ── INFO COMMANDS ───────────────────────────────────
            if (input === 'help') {
                printAsync('help', [
                    '┌─── AVAILABLE SIGNALS ───────────────────────────────────┐',
                    '│  INFO       whoami · bio · skills · experience           │',
                    '│             projects · certs · contact · linkedin        │',
                    '│  SYSTEM     date · sysinfo · ping · history              │',
                    '│  FUN        matrix · hack · sudo                         │',
                    '│  NAVIGATE   goto home · goto projects · goto contact     │',
                    '│  UTIL       clear                                        │',
                    '└─────────────────────────────────────────────────────────┘',
                ], 40);

            } else if (input === 'whoami') {
                printLine(input, 'Sonal Shashika Darshana Jayawardana<br><span class="output">IT Executive &amp; Infrastructure Architect | AAT Sri Lanka</span>');

            } else if (input === 'bio') {
                printAsync(input, [
                    'Over 11 years of professional IT experience at AAT Sri Lanka.',
                    'Promoted from Hardware Technician (2014) to IT Executive (2023).',
                    'Specialization: Virtualization, Network Security, System Automation.',
                    'Passionate about bridging hardware engineering with software solutions.',
                ]);

            } else if (input === 'skills') {
                printAsync(input, [
                    '── INFRASTRUCTURE ──────────────────────────────',
                    '  VMWare ESXi · Hyper-V · Active Directory',
                    '  FortiGate Firewalls · VLAN Configuration',
                    '── SOFTWARE DEVELOPMENT ────────────────────────',
                    '  C# · Python · JavaScript · HTML/CSS',
                    '── HARDWARE ────────────────────────────────────',
                    '  Server Builds · Diagnostics · Network Cabling',
                    '── MANAGEMENT ──────────────────────────────────',
                    '  IT Strategy · Team Leadership · Procurement',
                ]);

            } else if (input === 'experience') {
                printAsync(input, [
                    '── ROLE 01 ─────────────────────────────────────',
                    '  Title    : Information Technology Executive',
                    '  Company  : AAT Sri Lanka',
                    '  Period   : Mar 2023 – Present',
                    '  Focus    : IT Infrastructure, Leadership, System Reliability',
                    '── ROLE 02 ─────────────────────────────────────',
                    '  Title    : Computer Hardware Technician',
                    '  Company  : AAT Sri Lanka',
                    '  Period   : May 2014 – Apr 2023 (9 Years)',
                    '  Focus    : Hardware Repair, Network Troubleshooting',
                ]);

            } else if (input === 'projects') {
                printAsync(input, [
                    '── PROJECT 01 ──────────────────────────────────',
                    '  Enterprise Network Monitor',
                    '  Real-time Grafana dashboard for AAT LAN infrastructure.',
                    '── PROJECT 02 ──────────────────────────────────',
                    '  Automated Backup System',
                    '  PowerShell + Python system for automated server backups.',
                    '── PROJECT 03 ──────────────────────────────────',
                    '  AAT Corporate Portal Overhaul',
                    '  Full redesign of the AAT internal staff portal.',
                ]);

            } else if (input === 'certs') {
                printAsync(input, [
                    '── CERTIFICATIONS ──────────────────────────────',
                    '  [✓] Vocational Training Authority (VTA) – IT Support',
                    '  [✓] A+ Academy – CompTIA A+ Equivalent',
                    '  [✓] LITS – Advanced Networking & Administration',
                ]);

            } else if (input === 'contact') {
                printAsync(input, [
                    '── CONTACT ─────────────────────────────────────',
                    '  Email    : sonalshashika@gmail.com',
                    '  LinkedIn : linkedin.com/in/sonal-shashika-darshana-jayawardana-236828104',
                    '  Location : Sri Lanka 🇱🇰',
                ]);

            } else if (input === 'linkedin') {
                printLine(input, 'Opening LinkedIn profile... <span style="color:#00ffff">↗</span>');
                setTimeout(() => window.open('https://www.linkedin.com/in/sonal-shashika-darshana-jayawardana-236828104/', '_blank'), 500);

                // ── SYSTEM COMMANDS ─────────────────────────────────
            } else if (input === 'date') {
                const now = new Date();
                printLine(input, `${now.toDateString()} | ${now.toLocaleTimeString()} | TZ: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

            } else if (input === 'sysinfo') {
                printAsync(input, [
                    '── SYSTEM MANIFEST ─────────────────────────────',
                    `  NODE       : SONAL-NEXUS-7`,
                    `  CPU        : Neural Engine X Cyber Core (Overclocked)`,
                    `  RAM        : ∞ GB (Expandable)`,
                    `  OS         : CyberOS v3.7 — Stealth Edition`,
                    `  UPTIME     : ${Math.floor(performance.now() / 1000)}s`,
                    `  STATUS     : ██████████ 100% OPERATIONAL`,
                ]);

            } else if (input === 'ping') {
                printAsync(input, [
                    'Pinging target...',
                    'PONG — latency: 0.3ms (local universe)',
                    'Packet loss: 0% | Signal: STRONG',
                ], 300);

            } else if (input === 'history') {
                const lines = commandHistory.length > 1
                    ? commandHistory.slice(0, -1).map((cmd, i) => `  ${i + 1}.  ${cmd}`)
                    : ['  No previous commands in session.'];
                printAsync(input, ['── COMMAND HISTORY ─────────────────────────────', ...lines]);

                // ── FUN / EASTER EGG COMMANDS ────────────────────────
            } else if (input === 'matrix') {
                const chars = '01アイウエオカキクケコサシスセソ';
                const totalLines = 10;
                appendLine(`<span class="prompt">&gt; matrix</span>`);

                for (let i = 0; i < totalLines; i++) {
                    setTimeout(() => {
                        const l = document.createElement('div');
                        l.className = 'terminal-line';
                        l.style.color = '#00ff41';
                        l.style.fontFamily = 'monospace';
                        l.style.letterSpacing = '4px';
                        l.innerHTML = Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                        terminalOutput.appendChild(l);
                        terminalBody.scrollTop = terminalBody.scrollHeight;
                        if (i === totalLines - 1) {
                            setTimeout(() => appendLine(`<span class="output">Wake up, Neo...</span>`), 200);
                        }
                    }, i * 100);
                }

            } else if (input === 'hack') {
                const steps = [
                    'Initializing breach protocol...',
                    'Scanning target network... [██████████] 100%',
                    'Bypassing firewall...      [██████████] 100%',
                    'Decrypting credentials...  [██████████] 100%',
                    'Exfiltrating data...       [██████████] 100%',
                    '... just kidding. I work in IT Security. 😄',
                ];
                printAsync(input, steps, 400);

            } else if (input === 'sudo' || input.startsWith('sudo ')) {
                printAsync(input, [
                    '[sudo] password for sonal:',
                    'Sorry, try again.',
                    '[sudo] password for sonal:',
                    'Sorry, 3 incorrect password attempts and counting.',
                    'Access Denied. Nice try. 🔒',
                ], 500);

                // ── NAVIGATE COMMANDS ─────────────────────────────────
            } else if (input.startsWith('goto ')) {
                const target = input.replace('goto ', '').trim();
                const sectionMap = {
                    home: '#hero', hero: '#hero',
                    about: '#about', profile: '#about',
                    experience: '#experience',
                    skills: '#skills',
                    projects: '#projects',
                    terminal: '#terminal',
                    contact: '#contact',
                };
                if (sectionMap[target]) {
                    printLine(input, `Navigating to <span style="color:#00ffff">#${target}</span>...`);
                    setTimeout(() => {
                        const el = document.querySelector(sectionMap[target]);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 400);
                } else {
                    printLine(input, `ERR: UNKNOWN TARGET — try: home, projects, experience, skills, contact`);
                }

                // ── UTIL ─────────────────────────────────────────────
            } else if (input === 'clear') {
                terminalOutput.innerHTML = '';

            } else {
                printLine(input, `ERR: UNKNOWN_SIGNAL — "${raw.toUpperCase()}" — type <span style="color:#00ffff">help</span> for commands`);
            }
        }

        // Wire up Enter key
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const raw = terminalInput.value;
                terminalInput.value = '';
                handleCommand(raw);
            }
        });
    }

    // --- Project Hover Glitch ---
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mouseenter', () => card.classList.add('glitch-active'));
        card.addEventListener('mouseleave', () => card.classList.remove('glitch-active'));
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
