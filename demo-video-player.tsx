import { useState, useEffect, useRef, useCallback } from "react";
import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
    Maximize2, Subtitles, Settings, ChevronLeft,
    LayoutGrid, Info, Keyboard, X
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const MOVIE = {
    title: "Oppenheimer",
    year: 2023,
    rating: "R",
    duration: "3h 0m",
    totalSec: 180 * 60,
    genre: "Biography · Drama · History",
    synopsis:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
    chapters: [10, 24, 38, 52, 66, 80],
};

const NEXT = { title: "Killers of the Flower Moon", year: 2023 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${m}:${String(s).padStart(2, "0")}`;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MoviePlayer() {
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [vol, setVol] = useState(75);
    const [prog, setProg] = useState(14);     // 0–100
    const [buf, setBuf] = useState(32);       // 0–100
    const [idle, setIdle] = useState(false);
    const [paused, setPaused] = useState(true);
    const [showVol, setShowVol] = useState(false);
    const [hov, setHov] = useState(null);     // hover pct
    const [hovX, setHovX] = useState(0);
    const [shortcuts, setShortcuts] = useState(false);
    const [skipIntro, setSkipIntro] = useState(true);
    const [countdown, setCountdown] = useState(null);
    const [loading, setLoading] = useState(false);

    const idleRef = useRef(null);
    const playRef = useRef(null);
    const cntRef = useRef(null);
    const barRef = useRef(null);

    // Auto-hide Skip Intro
    useEffect(() => {
        const t = setTimeout(() => setSkipIntro(false), 9000);
        return () => clearTimeout(t);
    }, []);

    // Simulate playback
    useEffect(() => {
        if (playing) {
            playRef.current = setInterval(() => {
                setProg((p) => { if (p >= 100) { setPlaying(false); return 100; } return p + 0.016; });
                setBuf((b) => Math.min(100, b + 0.02));
            }, 100);
        } else clearInterval(playRef.current);
        return () => clearInterval(playRef.current);
    }, [playing]);

    // Countdown trigger
    useEffect(() => {
        if (prog >= 93 && countdown === null) setCountdown(30);
    }, [prog, countdown]);

    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            cntRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
        }
        return () => clearTimeout(cntRef.current);
    }, [countdown]);

    // Idle timer
    const resetIdle = useCallback(() => {
        setIdle(false);
        clearTimeout(idleRef.current);
        if (playing) idleRef.current = setTimeout(() => setIdle(true), 3200);
    }, [playing]);

    useEffect(() => {
        const keys = (e) => {
            resetIdle();
            if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
            if (e.key === "m") setMuted((v) => !v);
            if (e.key === "ArrowRight") setProg((p) => Math.min(100, p + 0.9));
            if (e.key === "ArrowLeft") setProg((p) => Math.max(0, p - 0.9));
            if (e.key === "?") setShortcuts((v) => !v);
            if (e.key === "Escape") setShortcuts(false);
        };
        window.addEventListener("keydown", keys);
        return () => window.removeEventListener("keydown", keys);
    }, [resetIdle]);

    const togglePlay = () => {
        setPlaying((p) => { const n = !p; setPaused(!n); return n; });
    };

    // Progress bar
    const seekTo = (e) => {
        if (!barRef.current) return;
        const r = barRef.current.getBoundingClientRect();
        setProg(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };
    const onHover = (e) => {
        if (!barRef.current) return;
        const r = barRef.current.getBoundingClientRect();
        const p = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
        setHov(p); setHovX(e.clientX - r.left);
    };

    const VolIcon = muted || vol === 0 ? VolumeX : vol < 40 ? Volume1 : Volume2;
    const curSec = (prog / 100) * MOVIE.totalSec;

    // Countdown ring
    const R = 18, C = 2 * Math.PI * R;
    const ringOffset = countdown !== null ? C - ((30 - countdown) / 30) * C : C;

    // ── CSS ──────────────────────────────────────────────────────────────────────
    const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
 
    *{margin:0;padding:0;box-sizing:border-box}
 
    :root{
      --red:#E50914;
      --amber:#F5A623;
      --bg:#07070E;
      --glass:rgba(7,7,14,0.85);
    }
 
    .mp{
      font-family:'DM Sans',sans-serif;
      position:fixed;inset:0;
      background:var(--bg);
      overflow:hidden;
      cursor:${idle ? "none" : "default"};
    }
 
    /* ── Aurora ── */
    .mp-aurora{
      position:absolute;inset:0;z-index:0;
      background:
        radial-gradient(ellipse 90% 70% at 50% 55%,rgba(229,9,20,0.09) 0%,transparent 60%),
        radial-gradient(ellipse 45% 45% at 12% 80%,rgba(245,166,35,0.07) 0%,transparent 55%),
        radial-gradient(ellipse 55% 55% at 88% 18%,rgba(229,9,20,0.05) 0%,transparent 55%),
        #07070E;
      animation:aurora 16s ease-in-out infinite alternate;
    }
    @keyframes aurora{0%{filter:hue-rotate(0deg) brightness(1)}100%{filter:hue-rotate(15deg) brightness(1.06)}}
 
    /* ── Spotlight ── */
    .mp-spot{
      position:absolute;inset:0;z-index:1;
      background:radial-gradient(ellipse 55% 65% at 50% 50%,rgba(255,255,255,0.03) 0%,transparent 68%);
      animation:spot 5.5s ease-in-out infinite;
    }
    @keyframes spot{0%,100%{opacity:.65;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
 
    /* ── Film grain ── */
    .mp-grain{
      position:absolute;inset:0;z-index:2;
      pointer-events:none;opacity:0.3;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }
 
    /* ── Letterbox ── */
    .mp-lt,.mp-lb{position:absolute;left:0;right:0;height:9%;background:#000;z-index:3}
    .mp-lt{top:0}.mp-lb{bottom:0}
 
    /* ── Shared overlay transition ── */
    .mp-ov{transition:opacity .5s ease,transform .4s ease}
 
    /* ── Top bar ── */
    .mp-top{
      position:absolute;top:9%;left:0;right:0;z-index:10;
      padding:18px 36px;
      display:flex;align-items:center;justify-content:space-between;
      background:linear-gradient(to bottom,rgba(0,0,0,0.88) 0%,transparent 100%);
    }
    .mp-top.mp-hide{opacity:0;transform:translateY(-7px);pointer-events:none}
 
    .mp-back{
      display:flex;align-items:center;gap:7px;
      background:none;border:none;
      color:rgba(255,255,255,.78);font-size:13px;font-weight:500;
      letter-spacing:.06em;cursor:pointer;
      font-family:'DM Sans',sans-serif;
      transition:color .2s,transform .2s;
    }
    .mp-back:hover{color:#fff;transform:translateX(-4px)}
 
    .mp-title-top{
      font-family:'DM Serif Display',serif;
      font-style:italic;font-size:20px;color:#fff;
      letter-spacing:.01em;
      text-shadow:0 2px 28px rgba(0,0,0,.95);
      position:absolute;left:50%;transform:translateX(-50%);
      white-space:nowrap;
    }
 
    .mp-cast{display:flex;align-items:center;gap:9px}
    .mp-av{
      width:32px;height:32px;border-radius:50%;
      background:linear-gradient(135deg,#9b0710,#E50914);
      border:1.5px solid rgba(255,255,255,.16);
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:700;color:#fff;
      cursor:pointer;letter-spacing:.02em;
      transition:transform .2s,border-color .2s,box-shadow .2s;
    }
    .mp-av:hover{transform:scale(1.18);border-color:var(--red);box-shadow:0 0 14px rgba(229,9,20,.5)}
    .mp-ib{
      background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
      border-radius:50%;width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      color:rgba(255,255,255,.65);cursor:pointer;transition:all .2s;
    }
    .mp-ib:hover{background:rgba(229,9,20,.3);border-color:var(--red);color:#fff}
 
    /* ── Bottom controls ── */
    .mp-ctrl{
      position:absolute;bottom:9%;left:0;right:0;z-index:10;
      padding:0 30px 20px;
      background:linear-gradient(to top,rgba(0,0,0,.98) 0%,rgba(0,0,0,.55) 65%,transparent 100%);
    }
    .mp-ctrl.mp-hide{opacity:0;transform:translateY(10px);pointer-events:none}
 
    /* ── Progress bar ── */
    .mp-bar-wrap{position:relative;padding:14px 0;cursor:pointer;margin-bottom:9px}
    .mp-bar-track{
      height:4px;background:rgba(255,255,255,.17);border-radius:4px;
      position:relative;transition:height .2s ease;
    }
    .mp-bar-wrap:hover .mp-bar-track{height:7px}
 
    .mp-buf{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,.26);border-radius:4px}
    .mp-played{
      position:absolute;top:0;left:0;height:100%;
      background:linear-gradient(90deg,#b8060f,#E50914,#ff3b45);border-radius:4px;
    }
    .mp-knob{
      position:absolute;top:50%;
      transform:translate(-50%,-50%) scale(0);
      width:15px;height:15px;
      background:#fff;border-radius:50%;
      box-shadow:0 0 14px rgba(229,9,20,.9),0 2px 8px rgba(0,0,0,.5);
      transition:transform .2s;pointer-events:none;
    }
    .mp-bar-wrap:hover .mp-knob{transform:translate(-50%,-50%) scale(1)}
    .mp-ch{
      position:absolute;top:50%;transform:translate(-50%,-50%);
      width:3px;height:3px;background:rgba(255,255,255,.5);
      border-radius:50%;pointer-events:none;
    }
    .mp-tip{
      position:absolute;bottom:32px;transform:translateX(-50%);
      background:rgba(7,7,14,.95);border:1px solid rgba(229,9,20,.35);
      border-radius:5px;padding:4px 9px;
      font-size:11.5px;color:#fff;font-weight:500;
      letter-spacing:.06em;white-space:nowrap;
      backdrop-filter:blur(12px);pointer-events:none;z-index:20;
    }
 
    /* ── Control row ── */
    .mp-row{display:flex;align-items:center;justify-content:space-between}
    .mp-l,.mp-r{display:flex;align-items:center;gap:5px}
 
    .mp-btn{
      background:none;border:none;
      color:rgba(255,255,255,.8);cursor:pointer;
      padding:8px;border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      transition:all .18s;
      font-family:'DM Sans',sans-serif;
    }
    .mp-btn:hover{color:#fff;background:rgba(255,255,255,.08);transform:scale(1.12)}
    .mp-btn:active{transform:scale(.94)}
 
    .mp-playbtn{
      width:50px;height:50px;
      background:rgba(229,9,20,.13);
      border:2px solid rgba(229,9,20,.44);
      border-radius:50%;color:#fff;
    }
    .mp-playbtn:hover{
      background:#E50914;border-color:#E50914;
      box-shadow:0 0 28px rgba(229,9,20,.65);
      transform:scale(1.1);
    }
 
    /* ── Volume ── */
    .mp-vol{display:flex;align-items:center;gap:3px}
    .mp-vslide-wrap{
      max-width:0;overflow:hidden;opacity:0;
      transition:max-width .32s ease,opacity .32s;
      display:flex;align-items:center;
    }
    .mp-vslide-wrap.open{max-width:84px;opacity:1}
    .mp-vslide{
      -webkit-appearance:none;appearance:none;
      width:76px;height:4px;border-radius:4px;outline:none;cursor:pointer;
      margin-left:3px;
      background:linear-gradient(90deg,var(--red) ${vol}%,rgba(255,255,255,.25) ${vol}%);
    }
    .mp-vslide::-webkit-slider-thumb{
      -webkit-appearance:none;width:12px;height:12px;
      background:#fff;border-radius:50%;cursor:pointer;
      box-shadow:0 0 7px rgba(229,9,20,.6);
    }
 
    .mp-time{
      color:rgba(255,255,255,.6);font-size:12.5px;font-weight:400;
      letter-spacing:.05em;white-space:nowrap;margin-left:4px;
    }
    .mp-time em{color:rgba(255,255,255,.3);font-style:normal;margin:0 3px}
 
    .mp-ctitle{
      font-size:11.5px;color:rgba(255,255,255,.38);
      letter-spacing:.15em;text-transform:uppercase;font-weight:500;
    }
 
    .mp-rbtn{
      background:none;border:none;
      color:rgba(255,255,255,.62);cursor:pointer;
      padding:7px;border-radius:7px;
      display:flex;align-items:center;justify-content:center;
      font-size:11.5px;font-weight:600;letter-spacing:.08em;gap:3px;
      font-family:'DM Sans',sans-serif;transition:all .18s;
    }
    .mp-rbtn:hover{color:#fff;background:rgba(255,255,255,.08)}
 
    .mp-npill{
      display:flex;align-items:center;gap:5px;
      background:rgba(229,9,20,.11);border:1px solid rgba(229,9,20,.36);
      border-radius:18px;padding:5px 13px;
      color:#fff;font-size:12px;font-weight:600;
      cursor:pointer;letter-spacing:.06em;
      font-family:'DM Sans',sans-serif;transition:all .2s;
    }
    .mp-npill:hover{background:#E50914;border-color:#E50914;box-shadow:0 0 18px rgba(229,9,20,.5)}
 
    /* ── Pause overlay ── */
    .mp-pause{
      position:absolute;top:9%;left:0;right:0;bottom:9%;z-index:8;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.52);
      backdrop-filter:blur(4px);
      transition:opacity .4s ease;
    }
    .mp-pause.mp-hide{opacity:0;pointer-events:none}
 
    .mp-pcard{
      display:flex;gap:22px;align-items:flex-start;
      background:rgba(7,7,14,.9);backdrop-filter:blur(28px);
      border:1px solid rgba(255,255,255,.07);border-radius:15px;
      padding:26px;max-width:500px;width:90%;
      box-shadow:0 28px 90px rgba(0,0,0,.75),0 0 0 1px rgba(229,9,20,.06);
      animation:cardIn .35s ease;
    }
    @keyframes cardIn{from{transform:scale(.96) translateY(10px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
 
    .mp-poster{
      width:95px;height:136px;border-radius:9px;flex-shrink:0;
      background:linear-gradient(148deg,#0f0408,#2a0810,#560d1a,#E50914 110%);
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Serif Display',serif;font-style:italic;
      font-size:12.5px;color:rgba(255,255,255,.82);
      text-align:center;padding:10px;letter-spacing:.02em;
      box-shadow:0 8px 32px rgba(0,0,0,.55);
    }
    .mp-ptitle{
      font-family:'DM Serif Display',serif;font-style:italic;
      font-size:24px;color:#fff;margin-bottom:5px;line-height:1.2;
    }
    .mp-pmeta{display:flex;gap:7px;align-items:center;margin-bottom:10px}
    .mp-pmeta-t{color:rgba(255,255,255,.42);font-size:12px}
    .mp-pbadge{
      border:1px solid rgba(255,255,255,.22);padding:1px 6px;
      border-radius:3px;color:rgba(255,255,255,.55);font-size:10.5px;font-weight:500;
    }
    .mp-psynopsis{
      font-size:12.5px;color:rgba(255,255,255,.52);line-height:1.65;margin-bottom:16px;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
    }
    .mp-resume{
      display:flex;align-items:center;gap:8px;
      background:#E50914;border:none;border-radius:8px;
      padding:10px 18px;color:#fff;font-size:13.5px;font-weight:600;
      cursor:pointer;letter-spacing:.04em;font-family:'DM Sans',sans-serif;
      animation:pulse 2.2s ease infinite;transition:transform .2s,box-shadow .2s;
    }
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(229,9,20,.4)}50%{box-shadow:0 0 0 12px rgba(229,9,20,0)}}
    .mp-resume:hover{transform:scale(1.04);animation:none;box-shadow:0 4px 28px rgba(229,9,20,.65)}
 
    /* ── Skip Intro ── */
    .mp-skip{
      position:absolute;right:34px;bottom:calc(9% + 112px);z-index:11;
      background:rgba(7,7,14,.93);border:1.5px solid rgba(229,9,20,.52);
      border-radius:6px;padding:9px 20px;color:#fff;
      font-size:13.5px;font-weight:600;letter-spacing:.07em;
      cursor:pointer;font-family:'DM Sans',sans-serif;
      backdrop-filter:blur(12px);overflow:hidden;
      animation:slideR .4s ease;transition:all .25s;
    }
    @keyframes slideR{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
    .mp-skip::before{
      content:'';position:absolute;inset:0;
      background:linear-gradient(90deg,transparent,rgba(229,9,20,.22),transparent);
      transform:translateX(-100%);animation:shim 2.6s ease-in-out infinite;
    }
    @keyframes shim{from{transform:translateX(-150%)}to{transform:translateX(200%)}}
    .mp-skip:hover{background:rgba(229,9,20,.75);border-color:#E50914;box-shadow:0 0 22px rgba(229,9,20,.4)}
 
    /* ── Next Episode Card ── */
    .mp-ncard{
      position:absolute;right:34px;bottom:calc(9% + 112px);z-index:11;
      width:225px;background:rgba(7,7,14,.96);
      border:1px solid rgba(255,255,255,.08);border-radius:12px;
      padding:14px;backdrop-filter:blur(24px);
      box-shadow:0 18px 55px rgba(0,0,0,.68);animation:slideR .4s ease;
    }
    .mp-nthumb{
      width:100%;height:108px;border-radius:8px;margin-bottom:11px;
      background:linear-gradient(145deg,#0d0618,#160824,#210920);
      position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;
    }
    .mp-nthumb::after{
      content:'';position:absolute;inset:0;
      background:radial-gradient(ellipse at 50% 50%,rgba(229,9,20,.07),transparent 70%);
    }
    .mp-nring{position:absolute;top:8px;right:8px;z-index:1}
    .mp-nlabel{font-size:10px;color:rgba(255,255,255,.36);text-transform:uppercase;letter-spacing:.14em;margin-bottom:3px;font-weight:600}
    .mp-ntitle{font-family:'DM Serif Display',serif;font-size:14px;color:#fff;margin-bottom:10px;line-height:1.3}
    .mp-nactions{display:flex;align-items:center;justify-content:space-between}
    .mp-nplay{
      background:#E50914;border:none;border-radius:6px;
      padding:6px 14px;color:#fff;font-size:12px;font-weight:600;
      cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;
    }
    .mp-nplay:hover{background:#ff1c2c;box-shadow:0 0 16px rgba(229,9,20,.55)}
    .mp-ncancel{
      background:none;border:none;color:rgba(255,255,255,.32);
      font-size:11px;cursor:pointer;text-decoration:underline;
      font-family:'DM Sans',sans-serif;transition:color .2s;
    }
    .mp-ncancel:hover{color:rgba(255,255,255,.62)}
 
    /* ── Shortcuts Modal ── */
    .mp-bdrop{
      position:absolute;inset:0;z-index:50;
      background:rgba(0,0,0,.7);backdrop-filter:blur(10px);
      display:flex;align-items:center;justify-content:center;
      animation:fadein .25s ease;
    }
    @keyframes fadein{from{opacity:0}to{opacity:1}}
    .mp-modal{
      background:rgba(10,10,18,.98);border:1px solid rgba(255,255,255,.08);
      border-radius:14px;padding:28px;width:375px;
      animation:scalein .25s ease;
      box-shadow:0 28px 85px rgba(0,0,0,.85);
    }
    @keyframes scalein{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}
    .mp-mhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .mp-mtitle{font-family:'DM Serif Display',serif;font-size:19px;color:#fff}
    .mp-mclose{
      background:rgba(255,255,255,.07);border:none;border-radius:50%;
      width:28px;height:28px;color:rgba(255,255,255,.5);cursor:pointer;
      display:flex;align-items:center;justify-content:center;transition:all .2s;
    }
    .mp-mclose:hover{background:rgba(229,9,20,.3);color:#fff}
    .mp-srow{
      display:flex;align-items:center;justify-content:space-between;
      padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05);
    }
    .mp-srow:last-child{border-bottom:none}
    .mp-skey{
      background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);
      border-radius:4px;padding:3px 9px;
      font-size:11.5px;color:rgba(255,255,255,.78);font-weight:600;
      font-family:monospace;letter-spacing:.04em;
    }
    .mp-slabel{font-size:12.5px;color:rgba(255,255,255,.52)}
 
    /* ── Loading spinner ── */
    .mp-spinner{
      position:absolute;top:9%;left:0;right:0;bottom:9%;z-index:9;
      display:flex;align-items:center;justify-content:center;pointer-events:none;
    }
    .mp-spin{
      width:46px;height:46px;
      border:3px solid rgba(229,9,20,.18);
      border-top-color:#E50914;border-radius:50%;
      animation:spin .75s linear infinite;
      box-shadow:0 0 26px rgba(229,9,20,.25);
    }
    @keyframes spin{to{transform:rotate(360deg)}}
  `;

    return (
        <>
            <style>{css}</style>

            <div className="mp" onMouseMove={resetIdle}>
                {/* Atmosphere */}
                <div className="mp-aurora" />
                <div className="mp-spot" />
                <div className="mp-grain" />

                {/* Letterbox */}
                <div className="mp-lt" />
                <div className="mp-lb" />

                {/* Spinner */}
                {loading && (
                    <div className="mp-spinner">
                        <div className="mp-spin" />
                    </div>
                )}

                {/* ──────────────── TOP BAR ──────────────── */}
                <div className={`mp-top mp-ov ${idle ? "mp-hide" : ""}`}>
                    <button className="mp-back">
                        <ChevronLeft size={17} />
                        Back to Browse
                    </button>

                    <div className="mp-title-top">
                        {MOVIE.title}&nbsp;·&nbsp;{MOVIE.year}
                    </div>

                    <div className="mp-cast">
                        {MOVIE.cast.slice(0, 3).map((n, i) => (
                            <div key={i} className="mp-av" title={n}>
                                {n.split(" ").map((w) => w[0]).join("")}
                            </div>
                        ))}
                        <button className="mp-ib"><Info size={13} /></button>
                    </div>
                </div>

                {/* ──────────────── PAUSE OVERLAY ──────────────── */}
                <div
                    className={`mp-pause ${!paused ? "mp-hide" : ""}`}
                    onClick={togglePlay}
                >
                    <div className="mp-pcard" onClick={(e) => e.stopPropagation()}>
                        <div className="mp-poster">Oppenheimer</div>
                        <div>
                            <div className="mp-ptitle">{MOVIE.title}</div>
                            <div className="mp-pmeta">
                                <span className="mp-pmeta-t">{MOVIE.year}</span>
                                <span className="mp-pmeta-t">·</span>
                                <span className="mp-pmeta-t">{MOVIE.duration}</span>
                                <span className="mp-pmeta-t">·</span>
                                <span className="mp-pbadge">{MOVIE.rating}</span>
                            </div>
                            <p className="mp-psynopsis">{MOVIE.synopsis}</p>
                            <button className="mp-resume" onClick={togglePlay}>
                                <Play size={15} fill="white" /> Resume
                            </button>
                        </div>
                    </div>
                </div>

                {/* ──────────────── SKIP INTRO ──────────────── */}
                {skipIntro && !idle && (
                    <button className="mp-skip" onClick={() => setSkipIntro(false)}>
                        Skip Intro →
                    </button>
                )}

                {/* ──────────────── NEXT EPISODE CARD ──────────────── */}
                {countdown !== null && !idle && (
                    <div className="mp-ncard">
                        <div className="mp-nthumb">
                            <div className="mp-nring">
                                <svg width="38" height="38" viewBox="0 0 44 44">
                                    <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
                                    <circle
                                        cx="22" cy="22" r={R}
                                        fill="none" stroke="#E50914" strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeDasharray={C}
                                        strokeDashoffset={ringOffset}
                                        transform="rotate(-90 22 22)"
                                        style={{ transition: "stroke-dashoffset 1s linear" }}
                                    />
                                    <text x="22" y="26.5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="DM Sans,sans-serif">
                                        {countdown}
                                    </text>
                                </svg>
                            </div>
                            <span style={{ color: "rgba(255,255,255,0.32)", fontSize: "11px", letterSpacing: "0.1em" }}>
                                UP NEXT
                            </span>
                        </div>
                        <div className="mp-nlabel">Next Film</div>
                        <div className="mp-ntitle">{NEXT.title}</div>
                        <div className="mp-nactions">
                            <button className="mp-nplay">▶ Play Now</button>
                            <button className="mp-ncancel" onClick={() => setCountdown(null)}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* ──────────────── BOTTOM CONTROLS ──────────────── */}
                <div className={`mp-ctrl mp-ov ${idle ? "mp-hide" : ""}`}>
                    {/* Progress */}
                    <div
                        className="mp-bar-wrap"
                        ref={barRef}
                        onClick={seekTo}
                        onMouseMove={onHover}
                        onMouseLeave={() => setHov(null)}
                    >
                        {hov !== null && (
                            <div className="mp-tip" style={{ left: `${hovX}px` }}>
                                {fmt((hov / 100) * MOVIE.totalSec)}
                            </div>
                        )}
                        <div className="mp-bar-track">
                            <div className="mp-buf" style={{ width: `${buf}%` }} />
                            <div className="mp-played" style={{ width: `${prog}%` }} />
                            {MOVIE.chapters.map((p, i) => (
                                <div key={i} className="mp-ch" style={{ left: `${p}%` }} />
                            ))}
                            <div className="mp-knob" style={{ left: `${prog}%` }} />
                        </div>
                    </div>

                    {/* Row */}
                    <div className="mp-row">
                        {/* Left cluster */}
                        <div className="mp-l">
                            <button
                                className="mp-btn"
                                onClick={() => setProg((p) => Math.max(0, p - 0.9))}
                                title="Rewind 10s"
                            >
                                <SkipBack size={20} />
                            </button>

                            <button className="mp-btn mp-playbtn" onClick={togglePlay}>
                                {playing
                                    ? <Pause size={21} fill="white" />
                                    : <Play size={21} fill="white" style={{ marginLeft: "2px" }} />}
                            </button>

                            <button
                                className="mp-btn"
                                onClick={() => setProg((p) => Math.min(100, p + 0.9))}
                                title="Forward 10s"
                            >
                                <SkipForward size={20} />
                            </button>

                            {/* Volume */}
                            <div
                                className="mp-vol"
                                onMouseEnter={() => setShowVol(true)}
                                onMouseLeave={() => setShowVol(false)}
                            >
                                <button className="mp-btn" onClick={() => setMuted((m) => !m)}>
                                    <VolIcon size={20} />
                                </button>
                                <div className={`mp-vslide-wrap ${showVol ? "open" : ""}`}>
                                    <input
                                        type="range"
                                        className="mp-vslide"
                                        min="0" max="100"
                                        value={muted ? 0 : vol}
                                        onChange={(e) => { setVol(+e.target.value); setMuted(false); }}
                                    />
                                </div>
                            </div>

                            <div className="mp-time">
                                {fmt(curSec)} <em>/</em> {MOVIE.duration}
                            </div>
                        </div>

                        {/* Center */}
                        <div className="mp-ctitle">{MOVIE.title}</div>

                        {/* Right cluster */}
                        <div className="mp-r">
                            <button className="mp-rbtn" title="Subtitles"><Subtitles size={16} /></button>
                            <button className="mp-rbtn" title="Audio Track">ENG</button>
                            <button className="mp-rbtn" title="Episodes"><LayoutGrid size={16} /></button>
                            <button
                                className="mp-npill"
                                onClick={() => { setCountdown(30); }}
                            >
                                <SkipForward size={12} /> Next
                            </button>
                            <button className="mp-rbtn" title="Settings"><Settings size={16} /></button>
                            <button
                                className="mp-rbtn"
                                onClick={() => setShortcuts(true)}
                                title="Keyboard Shortcuts (?)"
                            >
                                <Keyboard size={16} />
                            </button>
                            <button className="mp-rbtn" title="Fullscreen">
                                <Maximize2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ──────────────── SHORTCUTS MODAL ──────────────── */}
                {shortcuts && (
                    <div className="mp-bdrop" onClick={() => setShortcuts(false)}>
                        <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="mp-mhead">
                                <div className="mp-mtitle">Keyboard Shortcuts</div>
                                <button className="mp-mclose" onClick={() => setShortcuts(false)}>
                                    <X size={13} />
                                </button>
                            </div>
                            {[
                                ["Space / K", "Play · Pause"],
                                ["← / →", "Seek −/+ 10 seconds"],
                                ["↑ / ↓", "Volume up / down"],
                                ["M", "Mute · Unmute"],
                                ["F", "Toggle fullscreen"],
                                ["C", "Toggle captions"],
                                ["?", "Toggle shortcuts"],
                                ["Esc", "Close / Back"],
                            ].map(([k, l]) => (
                                <div key={k} className="mp-srow">
                                    <span className="mp-slabel">{l}</span>
                                    <span className="mp-skey">{k}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
