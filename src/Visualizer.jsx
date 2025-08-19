import { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import 'p5/lib/addons/p5.sound';

export default function Visualizer() {
  const canvasParentRef = useRef(null);
  const uiRef = useRef(null);
  const p5Ref = useRef(null);

  const [sensitivity, setSensitivity] = useState(1);
  const sensitivityRef = useRef(1);
  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);

  useEffect(() => {
    const LOG = (...a) => console.log('[Visualizer]', ...a);
    LOG('Mount useEffect start. window.p5 present =', !!window.p5);

    // ---- p5 Instance Sketch ----
    const sketch = (p) => {
      const LOGI = (...a)=>console.log('[Visualizer:p5]', ...a);
      const LOGW = (...a)=>console.warn('[Visualizer:p5]', ...a);
      LOGI('Sketch function created.');

      // ================= Constants (unused ones removed) =================
      const OVERLAY_PNG   = 'assets/bg.png';
      const OVERLAY_SCALE = 0.70;
      const SCENE_TIME_SCALE = 0.35;

      const SPRITE_COUNT = 6;
      const BASE_SCALE = 0.15;
      const MAX_SCALE_BOOST = 0.05;
      const MAX_ROT_SPEED = 0.025;
      const FLASH_MAX_ALPHA = 0.2;
      const KICK_DECAY = 0.88;
      const REACT_SMOOTH = 0.14;

      const STROBE_MIN_INTERVAL = 800;
      const STROBE_COLOR = [255, 220, 200];

      const CHROMA_MAX_OFFSET = 0.12;
      const CHROMA_DECAY = 0.88;
      const CHROMA_LAG = 0.12;

      const APPEAR_MIN_ALPHA = 0.06;
      const APPEAR_FADE_IN = 0.22;
      const APPEAR_FADE_OUT = 0.06;
      const APPEAR_KICK_THRESHOLD = 0.04;
      const APPEAR_LEVEL_THRESHOLD = 0.03;

      const BG_STROBE_DECAY     = 0.1;
      const BG_STROBE_MAX_ALPHA = 100;
      const BG_STROBE_HZ_MIN    = 6;
      const BG_STROBE_HZ_MAX    = 12;
      let   nextBgStrobeAt      = 100;

      const STREAK_COUNT = 20;
      const STREAK_SPEED_MIN = 0.004;
      const STREAK_SPEED_MAX = 0.010;
      const STREAK_LEN_PX_MIN = 40;
      const STREAK_LEN_PX_MAX = 160;
      const STREAK_BASE_WIDTH = 2.0;
      const STREAK_EDGE_WIDTH_MULT = 5.0;

      const WIRE_STYLES = {
        WHITE_DIM:   { mode:'mono', hue:0,   sat:0,   alpha:0.16, flicker:false },
        BLUE_ONLY:   { mode:'mono', hue:205, sat:100, alpha:0.22, flicker:false },
        NEON_RAINBOW:{ mode:'rainbow',       sat:100, alpha:0.18, flicker:false },
        STROBE:      { mode:'mono', hue:0,   sat:0,   alpha:0.28, flicker:true  },
      };

      // ================= Live Params & Scenes =================
      let LIVE = {
        STROBE_PROBABILITY: 0.08,
        CHROMA_SENS: 4.0,
        FEEDBACK_STRENGTH: 0.06,
        KALEI_SEGMENTS: 0,
        GLITCH_CHANCE: 0.06,
        SPRITE_SCALE: 0.75,
        REACTIVITY_MUL: 0.85,
        CAM_SHAKE_MUL: 1.0,
        CAM_ZOOM_MUL: 1.0,
        EDGE_BOOST_MULT: 1.0,
        EDGE_BOOST_POW: 1.4,

        STREAK_ENABLED: true,
        STREAK_COUNT: STREAK_COUNT,
        STREAK_SPEED_MIN: STREAK_SPEED_MIN,
        STREAK_SPEED_MAX: STREAK_SPEED_MAX,
        STREAK_BASE_WIDTH: STREAK_BASE_WIDTH,
        STREAK_EDGE_WIDTH_MULT: STREAK_EDGE_WIDTH_MULT,

        WIRE_ENABLED: true,
        WIRE_STYLE: 'WHITE_DIM',
        WIRE_SPOKES: 16,
        WIRE_CIRCLES: 18,
        WIRE_ROT_SPEED: 0.25,
        WIRE_SCROLL_SPEED: 0.30,
        WIRE_DASHED: false,
        WIRE_THICKNESS: 1.5,

        STREAK_THEME: {
          palette: 'rainbow',
            hueBase: 0,
            hueRange: 0,
            hueDrift: 0.6,
            sat: 90,
            bri: 100,
            alphaBase: 0.22,
            alphaEdgeBoost: 0.35,
            blend: 'ADD',
            flicker: { enabled:false, prob:0, minMul:0.15, maxMul:1, linkStrobe:false },
            direction: 'out',
            reverseProb: 0.4
        }
      };

      const SCENES = [
        {
          name: 'Neon Tunnel Marathon',
          durationSeconds: 180,
          images: ['assets/paul.png', 'assets/paola.png', 'assets/justi.png'],
          params: {
            REACTIVITY_MUL: 0.75,
            SPRITE_SCALE: 0.72,
            EDGE_BOOST_MULT: 1.8,
            EDGE_BOOST_POW:  1.1,
            STREAK_ENABLED: true,
            STREAK_COUNT: 96,
            STREAK_SPEED_MIN: 0.006,
            STREAK_SPEED_MAX: 0.012,
            STREAK_BASE_WIDTH: 2.0,
            STREAK_EDGE_WIDTH_MULT: 7.0,
            WIRE_ENABLED: true,
            WIRE_STYLE: 'WHITE_DIM',
            WIRE_SPOKES: 18,
            WIRE_CIRCLES: 22,
            WIRE_ROT_SPEED: 0.10,
            WIRE_SCROLL_SPEED: 0.10,
            WIRE_DASHED: false,
            WIRE_THICKNESS: 1.3,
            STREAK_THEME: {
              palette: 'rainbow',
              hueDrift: 1.2,
              sat: 95,
              bri: 100,
              alphaBase: 0.20,
              alphaEdgeBoost: 0.40,
              blend: 'ADD',
              flicker: { enabled:false, prob:0, minMul:0.2, maxMul:1, linkStrobe:false },
              direction: 'both',
              reverseProb: 0.25
            },
            STROBE_PROBABILITY: 0.05,
            CHROMA_SENS: 2.4,
            FEEDBACK_STRENGTH: 0.02,
            KALEI_SEGMENTS: 0,
            GLITCH_CHANCE: 0.03,
            CAM_SHAKE_MUL: 0.8,
            CAM_ZOOM_MUL: 0.9,
          },
          automate: {
            STROBE_PROBABILITY: [0.03, 0.12],
            CHROMA_SENS:        [1.8, 3.2],
            FEEDBACK_STRENGTH:  [0.00, 0.06],
          },
          lengthBeats: 16,
          fallbackSeconds: 20
        },
        {
          name: 'Kalei Cathedral (Blue Drift)',
          durationSeconds: 240,
          images: ['assets/paola.png', 'assets/justi.png', 'assets/paul.png'],
          params: {
            REACTIVITY_MUL: 0.80,
            SPRITE_SCALE: 0.65,
            EDGE_BOOST_MULT: 0.8,
            EDGE_BOOST_POW:  1.6,
            STREAK_ENABLED: true,
            STREAK_COUNT: 36,
            STREAK_SPEED_MIN: 0.004,
            STREAK_SPEED_MAX: 0.008,
            STREAK_EDGE_WIDTH_MULT: 3.0,
            WIRE_ENABLED: true,
            WIRE_STYLE: 'BLUE_ONLY',
            WIRE_SPOKES: 14,
            WIRE_CIRCLES: 20,
            WIRE_ROT_SPEED: -0.22,
            WIRE_SCROLL_SPEED: -0.18,
            WIRE_DASHED: true,
            WIRE_THICKNESS: 1.6,
            STREAK_THEME: {
              palette: 'blue',
              hueBase: 205,
              hueRange: 20,
              hueDrift: 0.25,
              sat: 80,
              bri: 100,
              alphaBase: 0.14,
              alphaEdgeBoost: 0.25,
              blend: 'ADD',
              flicker: { enabled:true, prob:0.02, minMul:0.35, maxMul:1, linkStrobe:false },
              direction: 'out'
            },
            KALEI_SEGMENTS: 10,
            FEEDBACK_STRENGTH: 0.10,
            CHROMA_SENS: 1.4,
            STROBE_PROBABILITY: 0.02,
            GLITCH_CHANCE: 0.02,
            CAM_SHAKE_MUL: 0.5,
            CAM_ZOOM_MUL: 0.7,
          },
          automate: {
            FEEDBACK_STRENGTH: [0.06, 0.14],
            CHROMA_SENS:       [1.0,  2.2],
          },
          lengthBeats: 16,
          fallbackSeconds: 20
        },
        {
          name: 'Glitch Storm (Strobe Lines)',
            durationSeconds: 150,
            images: ['assets/justi.png', 'assets/paul.png'],
            params: {
              REACTIVITY_MUL: 0.9,
              SPRITE_SCALE: 0.78,
              EDGE_BOOST_MULT: 1.2,
              EDGE_BOOST_POW:  1.2,
              STREAK_ENABLED: true,
              STREAK_COUNT: 64,
              STREAK_SPEED_MIN: 0.007,
              STREAK_SPEED_MAX: 0.013,
              STREAK_EDGE_WIDTH_MULT: 6.0,
              WIRE_ENABLED: true,
              WIRE_STYLE: 'STROBE',
              WIRE_SPOKES: 9,
              WIRE_CIRCLES: 12,
              WIRE_ROT_SPEED: 0.0,
              WIRE_SCROLL_SPEED: 0.28,
              WIRE_DASHED: false,
              WIRE_THICKNESS: 2.4,
              STREAK_THEME: {
                palette: 'white',
                hueDrift: 0.0,
                sat: 0,
                bri: 100,
                alphaBase: 0.10,
                alphaEdgeBoost: 0.50,
                blend: 'ADD',
                flicker: { enabled:true, prob:0.0, minMul:0.2, maxMul:1, linkStrobe:true },
                direction: 'out'
              },
              STROBE_PROBABILITY: 0.20,
              CHROMA_SENS: 3.6,
              FEEDBACK_STRENGTH: 0.00,
              KALEI_SEGMENTS: 0,
              GLITCH_CHANCE: 0.18,
              CAM_SHAKE_MUL: 1.4,
              CAM_ZOOM_MUL: 1.2,
            },
            automate: {
              GLITCH_CHANCE:       [0.06, 0.25],
              STROBE_PROBABILITY:  [0.08, 0.45],
              CHROMA_SENS:         [2.8, 4.2],
            },
            lengthBeats: 8,
            fallbackSeconds: 16
        },
        {
          name: 'Warm Drift (Inward Flow)',
          durationSeconds: 210,
          images: ['assets/paul.png', 'assets/paola.png'],
          params: {
            REACTIVITY_MUL: 0.70,
            SPRITE_SCALE: 0.62,
            EDGE_BOOST_MULT: 0.9,
            EDGE_BOOST_POW:  1.8,
            STREAK_ENABLED: true,
            STREAK_COUNT: 28,
            STREAK_SPEED_MIN: 0.004,
            STREAK_SPEED_MAX: 0.009,
            STREAK_EDGE_WIDTH_MULT: 4.0,
            WIRE_ENABLED: true,
            WIRE_STYLE: 'NEON_RAINBOW',
            WIRE_SPOKES: 22,
            WIRE_CIRCLES: 24,
            WIRE_ROT_SPEED: 0.35,
            WIRE_SCROLL_SPEED: 0.32,
            WIRE_DASHED: false,
            WIRE_THICKNESS: 1.4,
            STREAK_THEME: {
              palette: 'mono',
              hueBase: 34,
              hueRange: 8,
              hueDrift: 0.2,
              sat: 85,
              bri: 100,
              alphaBase: 0.16,
              alphaEdgeBoost: 0.30,
              blend: 'ADD',
              flicker: { enabled:true, prob:0.04, minMul:0.4, maxMul:1, linkStrobe:false },
              direction: 'in'
            },
            STROBE_PROBABILITY: 0.03,
            CHROMA_SENS: 1.8,
            FEEDBACK_STRENGTH: 0.08,
            KALEI_SEGMENTS: 6,
            GLITCH_CHANCE: 0.01,
            CAM_SHAKE_MUL: 0.4,
            CAM_ZOOM_MUL: 0.8,
          },
          automate: {
            SPRITE_SCALE:       [0.56, 0.80],
            FEEDBACK_STRENGTH:  [0.04, 0.12],
            CHROMA_SENS:        [1.4, 2.6],
          },
          lengthBeats: 24,
          fallbackSeconds: 20
        }
      ];

      // ================= State =================
      let sceneIdx = 0;
      let beatsInScene = 0;
      let bpmGuess = 130;
      let lastBeatMs = 0;
      let lastActivityMs = 0;
      let sceneToastAlpha = 0;
      let sceneStartMs = 0;

      let lastStrobeAt = 0;
      let strobePulse = 0;

      let chromaPulse = 0;
      let chromaSmooth = 0;

      let started = false;
      let mic = null;
      let fft = null, amp = null;

      let sprites = [];
      const imagesByPath = new Map();
      let prevReact = 0;
      let kickPulse = 0;
      let flashPulse = 0;

      let bassEMA = 0;
      const bassEMADecay = 0.85;
      const bassThresh = 0.01;

      let camShake = 0;
      let camZoom = 0;

      let particles = [];
      let glitchFrames = 0;
      let kaleiMix = 0;

      let bgBurstActive = false;
      let bgBurstRemaining = 0;
      let bgBurstHz = 10;
      let bgBurstCooldownUntil = 0;

      let wireRotPhase = 0;
      let wireScrollPhase = 0;

      let streaks = [];

      let overlayImg = null;
      let bgFlashPulse = 0;

      let SHOW_DEBUG_HUD = true;
      let SHOW_TOP_UI = false;
      let HUD_FORCE_SHOW = false;

      // ================= Helpers (Non-class) =================
      const isFS = () => !!document.fullscreenElement;
      const setUIVisible = (v) => {
        if (uiRef.current) uiRef.current.style.display = v ? '' : 'none';
      };
      const onFullscreenChange = () => {
        const want = (!isFS() || SHOW_TOP_UI);
        setUIVisible(want);
      };

      // ================= Preload =================
      p.preload = () => {
        LOGI('preload start');
        const allPaths = new Set();
        for (const sc of SCENES) sc.images.forEach(pth => allPaths.add(pth));
        allPaths.forEach(path => {
          LOGI('Queuing image load', path);
          const img = p.loadImage(
            path,
            () => LOGI('Image loaded', path),
            e => LOGW('Image failed', path, e)
          );
          imagesByPath.set(path, img);
        });
        try {
          LOGI('Loading overlay', OVERLAY_PNG);
          overlayImg = p.loadImage(
            OVERLAY_PNG,
            () => LOGI('Overlay loaded'),
            e => LOGW('Overlay load fail', e)
          );
        } catch (e) {
          LOGW('Overlay PNG load error (exception)', e);
        }
      };

      // ================= Classes =================
      class Streak {
        constructor() { this.reset(); }
        reset() {
          const ang = p.random(p.TWO_PI);
            this.dx = p.cos(ang); this.dy = p.sin(ang);
          const theme = LIVE.STREAK_THEME || {};
          const dirMode = theme.direction || 'out';
          if (dirMode === 'in') this.inward = true;
          else if (dirMode === 'both') this.inward = (p.random() < (theme.reverseProb ?? 0.5));
          else this.inward = false;

          this.edgeDist = edgeDistanceFromCenter(this.dx, this.dy);
          this.distMax  = this.edgeDist * p.random(1.05, 1.3);

          this.prog  = 0;
          this.speed = p.random(LIVE.STREAK_SPEED_MIN ?? STREAK_SPEED_MIN,
                                LIVE.STREAK_SPEED_MAX ?? STREAK_SPEED_MAX);
          this.len   = p.random(STREAK_LEN_PX_MIN, STREAK_LEN_PX_MAX);

          this.baseW = (LIVE.STREAK_BASE_WIDTH ?? STREAK_BASE_WIDTH) * p.random(0.8, 1.5);
          this.alpha = 0.25;
          this.hue = this._pickHue(theme);
        }
        _pickHue(theme) {
          const pal = (theme.palette || 'rainbow').toLowerCase();
          if (pal === 'white') return 0;
          if (pal === 'blue')
            return (theme.hueBase ?? 205) + p.random(-(theme.hueRange ?? 20), (theme.hueRange ?? 20));
          if (pal === 'mono')
            return (theme.hueBase ?? 0) + p.random(-(theme.hueRange ?? 0), (theme.hueRange ?? 0));
          return p.random(360);
        }
        _themeFlickerMul() {
          const flick = (LIVE.STREAK_THEME && LIVE.STREAK_THEME.flicker) ? LIVE.STREAK_THEME.flicker : null;
          if (!flick || !flick.enabled) return 1.0;
          if (flick.linkStrobe) {
            return p.constrain(0.15 + 0.85 * p.constrain(strobePulse, 0, 1), flick.minMul ?? 0.15, flick.maxMul ?? 1.0);
          }
          if (p.random() < (flick.prob ?? 0.02)) {
            return p.random(flick.minMul ?? 0.2, flick.maxMul ?? 1.0);
          }
          return 1.0;
        }
        update(audioReact, kick) {
          const t = p.constrain(this.prog, 0, 1);
          const accel = 1 + t * 1.4;
          this.prog += this.speed * accel * (0.85 + audioReact * 0.5 + kick * 0.8);
          if (this.prog >= 1.05) { this.reset(); return; }

            const cx = p.width / 2, cy = p.height / 2;
          const travel = (t * t) * this.distMax;

          if (!this.inward) {
            const prev = p.max(travel - this.len, 0);
            this.x  = cx + this.dx * travel;
            this.y  = cy + this.dy * travel;
            this.px = cx + this.dx * prev;
            this.py = cy + this.dy * prev;
          } else {
            const distFromCenter = this.distMax - travel;
            const prev = p.min(this.distMax, distFromCenter + this.len);
            this.x  = cx + this.dx * distFromCenter;
            this.y  = cy + this.dy * distFromCenter;
            this.px = cx + this.dx * prev;
            this.py = cy + this.dy * prev;
          }

          const edgeProx = p.constrain(travel / (this.edgeDist * 0.99), 0, 1);
          this.w = this.baseW
                 * (1 + Math.pow(edgeProx, 1.2) * (LIVE.STREAK_EDGE_WIDTH_MULT ?? STREAK_EDGE_WIDTH_MULT))
                 * (1 + audioReact * 0.2 + kick * 0.3);

          const theme = LIVE.STREAK_THEME || {};
          const aBase = theme.alphaBase ?? 0.18;
          const aEdge = theme.alphaEdgeBoost ?? 0.35;
          let a = aBase + edgeProx * aEdge;
          a *= this._themeFlickerMul();
          this.alpha = p.constrain(a, 0, 1);

          const pal = (theme.palette || 'rainbow').toLowerCase();
          const drift = theme.hueDrift ?? 0.6;
          if (pal === 'blue' || pal === 'mono') {
            const base = (pal === 'blue') ? (theme.hueBase ?? 205) : (theme.hueBase ?? 0);
            const range = theme.hueRange ?? (pal === 'blue' ? 20 : 0);
            this.hue += (p.random(-drift, drift));
            this.hue = p.constrain(this.hue, base - range, base + range);
          } else if (pal === 'rainbow') {
            this.hue += drift + audioReact * 2.0;
            if (this.hue >= 360) this.hue -= 360;
          }
        }
        draw() {
          const theme = LIVE.STREAK_THEME || {};
          const nx = -this.dy, ny = this.dx;
          const hwHead = this.w * 0.5;
          const hwTail = this.w * 0.25;

          const x1 = this.x  + nx * hwHead, y1 = this.y  + ny * hwHead;
          const x2 = this.x  - nx * hwHead, y2 = this.y  - ny * hwHead;
          const x3 = this.px - nx * hwTail, y3 = this.py - ny * hwTail;
          const x4 = this.px + nx * hwTail, y4 = this.py + ny * hwTail;

          p.push();
          p.blendMode((theme.blend || 'ADD') === 'BLEND' ? p.BLEND : p.ADD);
          p.noStroke();
          p.colorMode(p.HSB, 360, 100, 100, 1);
          const sat = theme.sat ?? 90;
          const bri = theme.bri ?? 100;
          const pal = (theme.palette || 'rainbow').toLowerCase();
          let drawHue = this.hue;
          let drawSat = sat;
          if (pal === 'white') drawSat = 0;
          p.fill(drawHue, drawSat, bri, this.alpha);
          p.quad(x1,y1,x2,y2,x3,y3,x4,y4);
          p.pop();
        }
      }

      class Sprite {
        constructor(img) {
          this.img = img;
          this.history = [];
          this.reset();
          this.active = true;
        }
        reset() {
          const cx = p.width / 2;
          const cy = p.height / 2;
          const ang = p.random(p.TWO_PI);
          this.dirX = p.cos(ang);
          this.dirY = p.sin(ang);

          const dx = this.dirX, dy = this.dirY;
          let tx = Infinity, ty = Infinity;
          if (dx > 0)      tx = (p.width  - cx) / dx;
          else if (dx < 0) tx = (0        - cx) / dx;
          if (dy > 0)      ty = (p.height - cy) / dy;
          else if (dy < 0) ty = (0        - cy) / dy;
          this.edgeDist = Math.min(tx, ty);

          this.prog   = 0;
          this.speed  = p.random(0.003, 0.008);
          this.distMax = this.edgeDist * p.random(1.12, 1.55);

          this.baseScale = BASE_SCALE * (0.8 + p.random(0.6));
          this.rot = p.random(p.TWO_PI);
          this.rotDir = p.random([ -1, 1 ]);
          this.tintHue = p.random(360);
          this.alpha = APPEAR_MIN_ALPHA;
          this.history.length = 0;
          this.x = cx;
          this.y = cy;
        }
        setImage(img) { this.img = img; }
        update(audioReact, kick, chroma=0) {
          const speedMul = 1 + audioReact * 0.6 + kick * 1.6;
          this.prog += this.speed * speedMul;
          if (this.prog >= 1.05) { this.reset(); return; }

          const t = p.constrain(this.prog, 0, 1);
          const easeIn = t * t;
          const cx = p.width / 2, cy = p.height / 2;
          const travel = easeIn * this.distMax;
          this.x = cx + this.dirX * travel;
          this.y = cy + this.dirY * travel;

          const scaleFromProg = Math.pow(t, 1.2);
          const edgeProx  = p.constrain(travel / (this.edgeDist * 0.99), 0, 1);
          const edgeBoost = 1 + Math.pow(edgeProx, LIVE.EDGE_BOOST_POW ?? 1.4) * (LIVE.EDGE_BOOST_MULT ?? 1.0);

          const s = this.baseScale * scaleFromProg * edgeBoost
                  * (1.0 + audioReact * MAX_SCALE_BOOST + kick * 0.35)
                  * (LIVE.SPRITE_SCALE ?? 1.0);

          const drawW = this.img.width * s;
          const drawH = this.img.height * s;

          const rotSpeed = MAX_ROT_SPEED * (0.2 + audioReact * 0.9 + kick * 0.6);
          this.rot += this.rotDir * rotSpeed;

          this.tintHue += 0.2 + audioReact * 1.0;
          if (this.tintHue >= 360) this.tintHue -= 360;

          const wantVisible =
            (t > 0.02) ||
            (kick > APPEAR_KICK_THRESHOLD) ||
            (audioReact > APPEAR_LEVEL_THRESHOLD);

          if (wantVisible) {
            this.alpha = p.lerp(this.alpha, 1.0, APPEAR_FADE_IN);
          } else {
            this.alpha = p.lerp(this.alpha, APPEAR_MIN_ALPHA, APPEAR_FADE_OUT);
          }
          const globalAlpha = p.constrain(this.alpha, 0, 1);

          this.history.push({x:this.x,y:this.y,r:this.rot,w:drawW,h:drawH,hue:this.tintHue,a:globalAlpha});
          if (this.history.length > 6) this.history.shift();

          // Trail
          p.push(); p.imageMode(p.CENTER); p.noStroke(); p.blendMode(p.ADD);
          let fade = 0.65;
          for (let i=0; i<this.history.length-1; i++) {
            const h = this.history[i];
            p.push(); p.translate(h.x,h.y); p.rotate(h.r);
            p.colorMode(p.HSB,360,100,100,1);
            p.tint(h.hue, 12, 100, 0.18 * fade * h.a);
            p.image(this.img, 0, 0, h.w*0.9, h.h*0.9);
            p.pop();
            fade *= 0.78;
          }
          p.pop();

          // Main
          p.push();
          p.translate(this.x, this.y);
          p.rotate(this.rot);
          p.imageMode(p.CENTER);

          if (chroma > 0.01) {
            const split = chroma * CHROMA_MAX_OFFSET * drawW;
            const layerA = p.constrain(0.65 + audioReact * 0.18 + kick * 0.18, 0.35, 1.0) * 255 * globalAlpha;
            p.push(); p.blendMode(p.ADD);
            p.tint(255,0,0, layerA * 0.9); p.image(this.img, -split, -split * 0.45, drawW, drawH);
            p.tint(0,255,0, layerA);       p.image(this.img, 0, 0, drawW, drawH);
            p.tint(0,0,255, layerA * 0.9); p.image(this.img,  split,  split * 0.45, drawW, drawH);
            p.pop();

            p.push(); p.blendMode(p.BLEND); p.colorMode(p.HSB,360,100,100,1);
            const tintA = p.constrain(0.45 + audioReact * 0.18 + kick * 0.12, 0.2, 0.9) * globalAlpha;
            p.tint(this.tintHue, 12, 100, tintA);
            p.image(this.img, 0, 0, drawW, drawH);
            p.pop();
          } else {
            p.colorMode(p.HSB,360,100,100,1);
            const tintA = p.constrain(0.8 + audioReact * 0.2 + kick * 0.2, 0.5, 1.0) * globalAlpha;
            p.tint(this.tintHue, 12, 100, tintA);
            p.image(this.img, 0, 0, drawW, drawH);
          }
          p.pop();
        }
      }

      // ================= Setup =================
      p.setup = () => {
        LOGI('setup start');
        const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
        cnv.parent(canvasParentRef.current);
        p.noStroke();
        p.imageMode(p.CORNER);
        bindGlobalKeys();
        onFullscreenChange();

        const initialImgs = getSceneImages(sceneIdx);
        for (let i=0; i<SPRITE_COUNT; i++) {
          const img = initialImgs[i % Math.max(1, initialImgs.length)] || p.createGraphics(32,32);
          sprites.push(new Sprite(img));
        }
        applySceneParams(sceneIdx);
        rebuildStreaks();
        showSceneToast();
        lastActivityMs = p.millis();
        sceneStartMs = p.millis();

        LOGI('Canvas created', p.width, p.height, 'sprites:', sprites.length);

        document.addEventListener('fullscreenchange', onFullscreenChange);
      };

      // ================= Audio =================
      async function startAudio() {
        LOGI('startAudio invoked. started=', started);
        if (started) return;
        try { await p.userStartAudio(); } catch(e){ console.warn('userStartAudio failed:', e); }
        mic = new p5.AudioIn();
        try {
          await new Promise((res, rej)=>mic.start(res, rej));
          fft = new p5.FFT(0.9, 1024);
          amp = new p5.Amplitude(0.9);
          fft.setInput(mic);
          amp.setInput(mic);
          started = true;
          LOGI('Mic permission granted. fft & amp created. started=', started);
        } catch (err) {
          LOGW('Mic start error', err);
        }
      }
      p.startAudio = startAudio;

      // ================= Resize =================
      p.windowResized = () => {
        LOGI('windowResized', window.innerWidth, window.innerHeight);
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        for (const s of sprites) s.reset();
        rebuildStreaks();
      };

      // ================= Draw =================
      p.draw = () => {
        if (p.frameCount <= 3) LOGI('draw frame', p.frameCount, 'canvas', p.width, p.height);
        p.background(0);
        const now = p.millis();
        updateSceneAutomation(now);

        let react = prevReact;
        if (isFS()) p.noCursor(); else p.cursor(p.ARROW);

        drawOverlayPNG();

        const sens = sensitivityRef.current;
        let level = 0, bass = 0, treble = 0;
        if (started && fft && amp) {
          level = amp.getLevel();
          bass = normBass(fft.getEnergy(20,150));
          treble = p.constrain(fft.getEnergy(4000,12000)/255, 0, 1);
        }

        bassEMA = p.lerp(bass, bassEMA, bassEMADecay);
        const bassDelta = Math.max(0, bass - (bassEMA + bassThresh));

        // Behind-overlay strobe burst logic
        {
          const intensity = p.constrain(react, 0, 1);
          const quiet = intensity < 0.06;
          if (!bgBurstActive && now >= bgBurstCooldownUntil && !quiet) {
            const startProb = 0.015 + intensity * (0.22 + LIVE.STROBE_PROBABILITY * 0.8);
            if (p.random() < startProb) {
              bgBurstActive = true;
              bgBurstRemaining = (p.random() < 0.40 ? 1 : p.floor(p.random(3,7)));
              bgBurstHz = p.lerp(BG_STROBE_HZ_MIN, BG_STROBE_HZ_MAX, intensity);
              nextBgStrobeAt = now;
            }
          }
          if (bgBurstActive && now >= nextBgStrobeAt) {
            bgFlashPulse = 1.0;
            bgBurstRemaining--;
            nextBgStrobeAt = now + (1000 / bgBurstHz) * p.random(0.85, 1.15);
            if (bgBurstRemaining <= 0) {
              bgBurstActive = false;
              bgBurstCooldownUntil = now + 250 + (1 - intensity) * p.random(400, 1400);
            }
          }
          if (bgFlashPulse > 0.01) {
            p.push(); p.blendMode(p.ADD);
            p.fill(255, BG_STROBE_MAX_ALPHA * bgFlashPulse);
            p.rect(0,0,p.width,p.height);
            p.pop();
            bgFlashPulse *= BG_STROBE_DECAY;
          }
        }

        const kickHit = bassDelta > 0.02;
        if (kickHit) {
          if (lastBeatMs > 0) {
            const dt = now - lastBeatMs;
            const instBpm = 60000 / Math.max(dt, 1);
            if (instBpm > 60 && instBpm < 200) bpmGuess = p.lerp(bpmGuess, instBpm, 0.15);
          }
          lastBeatMs = now;
          beatsInScene++;
          lastActivityMs = now;
        }
        if (level > 0.01) lastActivityMs = p.millis();

        if (kickHit) {
          kickPulse = Math.max(kickPulse, p.constrain(bassDelta * 4.0, 0, 1));
          flashPulse = Math.max(flashPulse, p.constrain(bassDelta * 3.0, 0, 1));
          spawnParticles(bassDelta);
          camShake = Math.min(camShake + 12 * kickPulse * (LIVE.CAM_SHAKE_MUL ?? 1.0), 18);
          camZoom  = Math.min(camZoom  + 0.015 * (0.6 + kickPulse) * (LIVE.CAM_ZOOM_MUL ?? 1.0), 0.08);
          if (LIVE.KALEI_SEGMENTS > 0 && p.random() < 0.08) kaleiMix = 1;
        }

        kickPulse *= KICK_DECAY;
        flashPulse *= 0.90;

        const trebDriven = Math.pow(treble, 1.8) * LIVE.CHROMA_SENS;
        chromaPulse = Math.max(chromaPulse, trebDriven);
        if (kickHit) chromaPulse *= 0.25;
        chromaPulse *= CHROMA_DECAY;
        chromaSmooth = p.constrain(p.lerp(chromaSmooth, chromaPulse, CHROMA_LAG), 0, 1);

        if (now - lastStrobeAt > STROBE_MIN_INTERVAL) {
          const intensity = p.constrain(react, 0, 1);
            const strong = (intensity > 0.18) || (kickPulse > 0.12);
          if (strong) {
            const prob = 0.02 + intensity * (0.35 + LIVE.STROBE_PROBABILITY * 0.9);
            if (p.random() < prob) {
              strobePulse = Math.max(strobePulse, 1.0);
              lastStrobeAt = now;
            }
          }
        }
        strobePulse *= 0.82;

        react = Math.pow(Math.min(level * 6, 1), 0.7) * 0.8 + Math.pow(bass, 1.4) * 1.3;
        react = (react + kickPulse * 0.6) * sens * (LIVE.REACTIVITY_MUL ?? 1.0);
        react = p.lerp(prevReact, react, REACT_SMOOTH);
        prevReact = react;

        const sc = SCENES[sceneIdx];
        const lenBeats = sc.lengthBeats || 16;
        const fallbackMs = (sc.fallbackSeconds ?? 12) * 1000;
        const durMs = getSceneDurationMs(sc);
        const timeIsUp = durMs > 0 && (now - sceneStartMs >= durMs);
        if (timeIsUp || beatsInScene >= lenBeats || p.millis() - lastActivityMs > fallbackMs) nextScene();

        camShake *= 0.86; camZoom *= 0.90;

        // Camera transform
        p.push();
        p.translate(p.random(-camShake, camShake), p.random(-camShake, camShake));
        p.scale(1 + camZoom);

        drawWireGrid(react, kickPulse, strobePulse);
        if (LIVE.STREAK_ENABLED) {
          for (const st of streaks) { st.update(react, kickPulse); st.draw(); }
        }
        for (const s of sprites) s.update(react, kickPulse, chromaSmooth);

        if (flashPulse > 0.01) {
          p.push(); p.blendMode(p.ADD);
          p.fill(255, 255 * (FLASH_MAX_ALPHA * flashPulse));
          p.rect(0,0,p.width,p.height);
          p.pop();
        }

        if (strobePulse > 0.01) {
          p.push(); p.blendMode(p.ADD);
          const alpha = p.constrain(strobePulse, 0, 1) * 200;
          p.fill(STROBE_COLOR[0], STROBE_COLOR[1], STROBE_COLOR[2], alpha);
          p.rect(0,0,p.width,p.height);
          p.pop();
        }

        updateParticles();
        drawParticles();
        p.pop(); // end camera

        if (LIVE.FEEDBACK_STRENGTH > 0.001) {
          p.push(); p.blendMode(p.ADD);
          const tAlpha = 255 * (LIVE.FEEDBACK_STRENGTH * (0.6 + react));
          p.tint(255, tAlpha);
          p.translate(p.width/2, p.height/2);
          p.rotate(0.003 + react * 0.01);
          p.scale(0.985 - react * 0.01);
          p.image(p.get(), -p.width/2, -p.height/2);
          p.pop();
        }

        if (treble > 0.6 && p.random() < LIVE.GLITCH_CHANCE) glitchFrames = 2;
        if (glitchFrames > 0) {
          p.push(); p.blendMode(p.BLEND);
          const slices = 8;
          for (let i=0; i<slices; i++) {
            const y = (p.height / slices) * i;
            const h = p.height / slices;
            const xOffset = p.random(-20, 20) * (1 + kickPulse*2);
            p.copy(0,y,p.width,h, xOffset, y, p.width, h);
          }
          p.pop();
          glitchFrames--;
        }

        kaleiMix *= 0.94;
        if (LIVE.KALEI_SEGMENTS > 0 && kaleiMix > 0.02) {
          const src = p.get();
          p.push();
          p.translate(p.width/2, p.height/2);
          p.imageMode(p.CENTER);
          p.blendMode(p.ADD);
          p.tint(255, 140 * kaleiMix);
          for (let i=0; i<LIVE.KALEI_SEGMENTS; i++) {
            p.push();
            p.rotate((p.TWO_PI / LIVE.KALEI_SEGMENTS) * i);
            if (i % 2 === 0) p.scale(-1,1);
            p.image(src, 0, 0, p.width, p.height);
            p.pop();
          }
          p.pop();
        }

        if (SHOW_DEBUG_HUD && (!isFS() || HUD_FORCE_SHOW)) drawHUD(level, bass, react, kickPulse);
        drawSceneToast();
      };

      // ================= HUD & UI =================
      function drawHUD(level, bass, react, kick) {
        p.push(); p.resetMatrix(); p.noStroke(); p.fill(255,190); p.textSize(12);
        const sc = SCENES[sceneIdx];
        p.text(
          `started:${started}  scene:${sc.name}  bpm:${bpmGuess.toFixed(1)}  lvl:${level.toFixed(3)}  bass:${bass.toFixed(3)}  react:${react.toFixed(3)}  kick:${kick.toFixed(3)}`,
          12, p.height - 14
        );
        p.pop();
      }
      function normBass(v) { const x = p.constrain(v / 255, 0, 1); return Math.pow(x, 1.1); }

      function drawOverlayPNG() {
        if (!overlayImg) return;
        const cw = p.width, ch = p.height;
        const iw = overlayImg.width, ih = overlayImg.height;
        const fitScale = Math.min(cw / iw, ch / ih) * OVERLAY_SCALE;
        const w = iw * fitScale, h = ih * fitScale;
        const x = (cw - w)/2, y = (ch - h)/2;
        p.push();
        p.imageMode(p.CORNER);
        p.tint(255,255);
        p.image(overlayImg, x, y, w, h);
        p.pop();
      }

      function spawnParticles(bassDelta) {
        const n = 12 + p.floor(p.constrain(bassDelta * 40, 0, 60));
        for (let i=0; i<n; i++) {
          const s = sprites[p.floor(p.random(sprites.length))];
          particles.push({
            x: s?.x ?? p.width/2,
            y: s?.y ?? p.height/2,
            vx: p.random(-3,3),
            vy: p.random(-4,2),
            size: p.random(2,8),
            life: 180 + p.random(60)
          });
        }
      }
      function updateParticles() {
        for (const prt of particles) {
          prt.vx *= 0.98; prt.vy *= 0.98; prt.life -= 2;
          prt.x += prt.vx; prt.y += prt.vy;
        }
        particles = particles.filter(p => p.life > 0);
      }
      function drawParticles() {
        p.push(); p.blendMode(p.ADD); p.noStroke();
        for (const prt of particles) {
          p.fill(255, 215, 190, prt.life);
          p.circle(prt.x, prt.y, 2 + prt.size * (prt.life/255));
        }
        p.pop();
      }

      function getSceneImages(idx) {
        LOGI('getSceneImages', idx);
        const sc = SCENES[idx % SCENES.length];
        const out = [];
        for (const path of sc.images) {
          const img = imagesByPath.get(path);
            if (img) out.push(img);
        }
        if (out.length === 1) {
          const base = out[0];
          const g1 = p.createGraphics(base.width, base.height); g1.push(); g1.translate(base.width,0); g1.scale(-1,1); g1.image(base,0,0); g1.pop();
          const g2 = p.createGraphics(base.width, base.height); g2.tint(255, 200); g2.image(base,0,0);
          out.push(g1, g2);
        }
        LOGI('Scene images resolved', out.length);
        return out.length ? out : [p.createGraphics(32,32)];
      }

      function applySceneParams(idx) {
        LOGI('applySceneParams', idx);
        const { params } = SCENES[idx % SCENES.length];
        LIVE.STROBE_PROBABILITY = params.STROBE_PROBABILITY ?? LIVE.STROBE_PROBABILITY;
        LIVE.CHROMA_SENS        = params.CHROMA_SENS        ?? LIVE.CHROMA_SENS;
        LIVE.FEEDBACK_STRENGTH  = params.FEEDBACK_STRENGTH  ?? LIVE.FEEDBACK_STRENGTH;
        LIVE.KALEI_SEGMENTS     = params.KALEI_SEGMENTS     ?? LIVE.KALEI_SEGMENTS;
        LIVE.GLITCH_CHANCE      = params.GLITCH_CHANCE      ?? LIVE.GLITCH_CHANCE;
        LIVE.SPRITE_SCALE       = params.SPRITE_SCALE       ?? LIVE.SPRITE_SCALE;
        LIVE.WIRE_ENABLED       = params.WIRE_ENABLED       ?? LIVE.WIRE_ENABLED;
        LIVE.WIRE_STYLE         = params.WIRE_STYLE         ?? LIVE.WIRE_STYLE;
        LIVE.WIRE_SPOKES        = params.WIRE_SPOKES        ?? LIVE.WIRE_SPOKES;
        LIVE.WIRE_CIRCLES       = params.WIRE_CIRCLES       ?? LIVE.WIRE_CIRCLES;
        LIVE.WIRE_ROT_SPEED     = params.WIRE_ROT_SPEED     ?? LIVE.WIRE_ROT_SPEED;
        LIVE.WIRE_SCROLL_SPEED  = params.WIRE_SCROLL_SPEED  ?? LIVE.WIRE_SCROLL_SPEED;
        LIVE.WIRE_DASHED        = params.WIRE_DASHED        ?? LIVE.WIRE_DASHED;
        LIVE.WIRE_THICKNESS     = params.WIRE_THICKNESS     ?? LIVE.WIRE_THICKNESS;
        for (const [k,v] of Object.entries(params)) {
          if (k === 'STREAK_THEME') continue;
          if (k in LIVE) LIVE[k] = v;
        }
        LIVE.STREAK_THEME = params.STREAK_THEME
          ? JSON.parse(JSON.stringify(params.STREAK_THEME))
          : LIVE.STREAK_THEME;
        rebuildStreaks();
        LOGI('Params applied', { idx, LIVE_snapshot: { STROBE_PROBABILITY:LIVE.STROBE_PROBABILITY, CHROMA_SENS:LIVE.CHROMA_SENS, KALEI_SEGMENTS:LIVE.KALEI_SEGMENTS } });
      }

      function nextScene(toIndex = null) {
        const old = sceneIdx;
        sceneIdx = toIndex !== null
          ? (toIndex % SCENES.length + SCENES.length) % SCENES.length
          : (sceneIdx + 1) % SCENES.length;
        beatsInScene = 0;
        applySceneParams(sceneIdx);
        sceneStartMs = p.millis();
        const imgs = getSceneImages(sceneIdx);
        for (let i=0; i<sprites.length; i++) {
          sprites[i].setImage(imgs[i % imgs.length]);
          sprites[i].alpha = Math.max(sprites[i].alpha, 0.6);
        }
        strobePulse = 1;
        kaleiMix = LIVE.KALEI_SEGMENTS > 0 ? 1 : 0.5;
        showSceneToast();
        lastActivityMs = p.millis();
        LOGI('Scene change', { from: old, to: sceneIdx, name: SCENES[sceneIdx].name });
      }
      p.nextScene = nextScene;

      function showSceneToast() { sceneToastAlpha = 1; }
      function drawSceneToast() {
        if (sceneToastAlpha <= 0.01) return;
        sceneToastAlpha *= 0.95;
        const sc = SCENES[sceneIdx];
        p.push(); p.resetMatrix(); p.textAlign(p.CENTER, p.CENTER);
        const y = p.height * 0.18;
        p.fill(0, 200 * sceneToastAlpha); p.noStroke();
        p.rect(p.width*0.25, y-28, p.width*0.5, 56, 12);
        p.fill(255, 255 * sceneToastAlpha);
        p.textSize(28);
        p.text(sc.name, p.width/2, y);
        p.pop();
      }

      function getSceneDurationMs(sc) {
        if (sc.durationSeconds) return sc.durationSeconds * SCENE_TIME_SCALE * 1000;
        return 0;
      }
      function updateSceneAutomation(now) {
        const sc = SCENES[sceneIdx];
        const dur = getSceneDurationMs(sc);
        if (!dur || !sc.automate) return;
        const t = p.constrain((now - sceneStartMs) / dur, 0, 1);
        for (const [k, range] of Object.entries(sc.automate)) {
          const [a,b] = range;
          let v = p.lerp(a,b,t);
          if (k === 'KALEI_SEGMENTS' || k === 'STREAK_COUNT') v = Math.round(v);
          LIVE[k] = v;
        }
      }

      function rebuildStreaks() {
        streaks = [];
        if (!LIVE.STREAK_ENABLED) return;
        const count = LIVE.STREAK_COUNT ?? STREAK_COUNT;
        for (let i=0; i<count; i++) streaks.push(new Streak());
        LOGI('Streaks rebuilt', streaks.length);
      }

      function edgeDistanceFromCenter(dx, dy) {
        const cx = p.width/2, cy = p.height/2;
        const tx = dx > 0 ? (p.width  - cx) / dx : (dx < 0 ? (0 - cx) / dx : Infinity);
        const ty = dy > 0 ? (p.height - cy) / dy : (dy < 0 ? (0 - cy) / dy : Infinity);
        return Math.min(tx, ty);
      }

      function drawWireGrid(react, kick, strobePulse) {
        if (!LIVE.WIRE_ENABLED) return;
        const style = WIRE_STYLES[LIVE.WIRE_STYLE] || WIRE_STYLES.WHITE_DIM;
        const dt = p.deltaTime ? (p.deltaTime/1000) : 0.016;
        wireRotPhase    += LIVE.WIRE_ROT_SPEED    * dt * (0.8 + react * 0.8 + kick * 0.4);
        wireScrollPhase += LIVE.WIRE_SCROLL_SPEED * dt * (0.7 + react * 0.9 + kick * 0.5);

        const cx = p.width/2, cy = p.height/2;
        const maxR = Math.hypot(cx, cy) * 1.05;
        let alphaMul = style.alpha;
        if (style.flicker) alphaMul *= Math.min(1, strobePulse * 1.6);
        alphaMul *= (0.8 + react * 0.6);

        p.push();
        p.translate(cx, cy);
        p.rotate(wireRotPhase);
        p.noFill();
        p.strokeCap(p.ROUND);
        p.colorMode(p.HSB, 360, 100, 100, 1);

        const sw = LIVE.WIRE_THICKNESS * (1 + react * 0.8 + kick * 0.6);
        p.strokeWeight(sw);
        for (let i=0; i<LIVE.WIRE_SPOKES; i++) {
          const a = (i / LIVE.WIRE_SPOKES) * p.TWO_PI;
          let h = style.mode === 'rainbow' ? ((a*180/Math.PI + p.frameCount*0.6) % 360) : (style.hue || 0);
          let s = style.sat;
          p.stroke(h, s, 100, alphaMul);
          p.line(0, 0, Math.cos(a) * maxR, Math.sin(a) * maxR);
        }

        const rings = LIVE.WIRE_CIRCLES;
        const dashSegs = 56;
        for (let j=0; j<rings; j++) {
          let u = (j / rings + wireScrollPhase) % 1;
          if (u < 0) u += 1;
          const r = u * maxR;
          if (r < 6) continue;
          const k = Math.pow(u, 0.85);
          const w = Math.max(1, LIVE.WIRE_THICKNESS * (0.7 + k * 1.2));
          p.strokeWeight(w);

          if (style.mode === 'rainbow') {
            const hue = ((u*360 + p.frameCount*0.6) % 360);
            p.stroke(hue, style.sat, 100, alphaMul * (0.7 + 0.3*k));
          } else {
            p.stroke(style.hue || 0, style.sat, 100, alphaMul * (0.7 + 0.3*k));
          }

          if (LIVE.WIRE_DASHED) {
            const step = p.TWO_PI / dashSegs;
            for (let a=0; a<p.TWO_PI; a+=step*2) {
              p.arc(0,0,r*2,r*2,a,a+step);
            }
          } else {
            p.ellipse(0,0,r*2,r*2);
          }
        }
        p.pop();
      }

      function toggleFullscreen() {
        LOGI('toggleFullscreen request. current=', !!document.fullscreenElement);
        if (!isFS()) {
          document.documentElement.requestFullscreen().catch(()=>{});
        } else {
          document.exitFullscreen().catch(()=>{});
        }
      }
      p.doubleClicked = toggleFullscreen;

      function bindGlobalKeys() {
        p.keyPressed = () => {
          LOGI('keyPressed', p.key, p.keyCode);
          if (p.keyCode === p.RIGHT_ARROW) nextScene(sceneIdx + 1);
          else if (p.keyCode === p.LEFT_ARROW) nextScene(sceneIdx - 1);
          else if (p.key === '1') nextScene(0);
          else if (p.key === '2') nextScene(1);
          else if (p.key === '3') nextScene(2);
          else if (p.key === '4') nextScene(3);
          else if (p.key === 'h' || p.key === 'H') HUD_FORCE_SHOW = !HUD_FORCE_SHOW;
          else if (p.key === 'd' || p.key === 'D') SHOW_DEBUG_HUD = !SHOW_DEBUG_HUD;
          else if (p.key === 'u' || p.key === 'U') {
            SHOW_TOP_UI = !SHOW_TOP_UI;
            onFullscreenChange();
          }
          else if (p.key === 'f' || p.key === 'F') toggleFullscreen();
        };
      }

      // ================= Cleanup hook =================
      p.remove = (orig => function() {
        LOGI('p5 instance remove called');
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        orig.call(this);
      })(p.remove);
    };

    try {
      LOG('Creating p5 instance...');
      p5Ref.current = new p5(sketch);
      LOG('p5 instance created successfully.');
    } catch (e) {
      console.error('[Visualizer] p5 instantiation failed', e);
    }

    return () => {
      LOG('Cleanup effect - removing p5');
      p5Ref.current?.remove();
      p5Ref.current = null;
      LOG('Cleanup complete.');
    };
  }, []);

  const handleStart = () => {
    console.log('[Visualizer] Start Audio button click');
    p5Ref.current?.startAudio?.();
  };
  const handleFullscreen = () => {
    console.log('[Visualizer] Fullscreen button click');
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
    else document.exitFullscreen().catch(()=>{});
  };

  return (
    <div style={{position:'relative', width:'100%', height:'100vh', background:'#000', overflow:'hidden'}}>
      <div
        ref={uiRef}
        style={{
          position:'absolute', top:12, left:12, right:12, zIndex:50,
          display:'flex', gap:12, flexWrap:'wrap',
          background:'rgba(0,0,0,0.55)', padding:'10px 12px',
          borderRadius:10, backdropFilter:'blur(6px)', alignItems:'center'
        }}
      >
        <button onClick={handleStart}>▶ Start Audio</button>
        <input type="file" accept="video/*" style={{maxWidth:160}} disabled />
        <input type="file" accept="image/*" style={{maxWidth:160}} disabled />
        <button onClick={handleFullscreen}>⛶ Fullscreen</button>
        <label style={{display:'flex', alignItems:'center', gap:6}}>
          Sensitivity
          <input
            type="range"
            min="0.2" max="3" step="0.05"
            value={sensitivity}
            onChange={e=>setSensitivity(parseFloat(e.target.value))}
          />
        </label>
        <span style={{fontSize:12, opacity:.8}}>
          Start Audio & erlaube Mikro. Keys: ← → scenes, 1-4 jump, f fullscreen, u UI, d HUD, h HUD force, double-click canvas.
        </span>
      </div>
      <div ref={canvasParentRef} style={{position:'absolute', inset:0}} />
    </div>
  );
};
