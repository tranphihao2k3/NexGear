'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Camera, Mic, Volume2, Monitor, Keyboard,
    Play, Square, CheckCircle, XCircle, RotateCcw, Maximize, ChevronLeft
} from 'lucide-react';
import s from './page.module.scss';
import { LazyImage } from '@/components/ui';

// ── Types ──
type TestStatus = 'idle' | 'running' | 'pass' | 'fail';

interface TestCard {
    id: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
}

const TESTS: TestCard[] = [
    { id: 'webcam', title: 'Webcam', desc: 'Mở camera, preview & chụp ảnh test', icon: <Camera size={28} /> },
    { id: 'mic', title: 'Microphone', desc: 'Thu âm, VU meter realtime, phát lại', icon: <Mic size={28} /> },
    { id: 'audio', title: 'Loa / Audio', desc: 'Test âm thanh trái/phải, bass, stereo', icon: <Volume2 size={28} /> },
    { id: 'display', title: 'Màn hình', desc: 'Dead pixel, resolution, refresh rate', icon: <Monitor size={28} /> },
    { id: 'keyboard', title: 'Bàn phím', desc: 'Keyboard tester full-size, highlight phím nhấn', icon: <Keyboard size={28} /> },
];

// ── Full-size Keyboard layout ──
// Main area
const KB_FUNC_ROW = ['Escape', '', 'F1', 'F2', 'F3', 'F4', '', 'F5', 'F6', 'F7', 'F8', '', 'F9', 'F10', 'F11', 'F12'];
const KB_ROWS_MAIN = [
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
    ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
    ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
    ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
    ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ContextMenu', 'ControlRight'],
];
// Nav cluster
const KB_NAV_TOP = ['PrintScreen', 'ScrollLock', 'Pause'];
const KB_NAV_MID = ['Insert', 'Home', 'PageUp'];
const KB_NAV_BOT = ['Delete', 'End', 'PageDown'];
// Arrow keys
const KB_ARROWS = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
// Numpad
const KB_NUM_ROWS = [
    ['NumLock', 'NumpadDivide', 'NumpadMultiply', 'NumpadSubtract'],
    ['Numpad7', 'Numpad8', 'Numpad9', 'NumpadAdd'],
    ['Numpad4', 'Numpad5', 'Numpad6'],
    ['Numpad1', 'Numpad2', 'Numpad3', 'NumpadEnter'],
    ['Numpad0', 'NumpadDecimal'],
];

const ALL_KEYS = [
    ...KB_FUNC_ROW.filter(Boolean),
    ...KB_ROWS_MAIN.flat(),
    ...KB_NAV_TOP, ...KB_NAV_MID, ...KB_NAV_BOT,
    ...KB_ARROWS,
    ...KB_NUM_ROWS.flat(),
];

const KB_LABELS: Record<string, string> = {
    Escape: 'Esc', Backquote: '`', Minus: '-', Equal: '=', Backspace: '⌫',
    Tab: 'Tab', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
    CapsLock: 'Caps', Semicolon: ';', Quote: "'", Enter: 'Enter',
    ShiftLeft: 'Shift', Comma: ',', Period: '.', Slash: '/', ShiftRight: 'Shift',
    ControlLeft: 'Ctrl', MetaLeft: 'Win', AltLeft: 'Alt', Space: 'Space',
    AltRight: 'Alt', MetaRight: 'Win', ContextMenu: 'Menu', ControlRight: 'Ctrl',
    Delete: 'Del', Insert: 'Ins', Home: 'Home', End: 'End',
    PageUp: 'PgUp', PageDown: 'PgDn',
    PrintScreen: 'PrtSc', ScrollLock: 'ScrLk', Pause: 'Pause',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    NumLock: 'Num', NumpadDivide: '/', NumpadMultiply: '*', NumpadSubtract: '-',
    NumpadAdd: '+', NumpadEnter: 'Enter', NumpadDecimal: '.',
    Numpad0: '0', Numpad1: '1', Numpad2: '2', Numpad3: '3',
    Numpad4: '4', Numpad5: '5', Numpad6: '6', Numpad7: '7',
    Numpad8: '8', Numpad9: '9',
};

const WIDE_KEYS = new Set(['ShiftLeft', 'ShiftRight', 'Backspace', 'Enter', 'CapsLock', 'Tab']);

function getKeyLabel(code: string) {
    if (KB_LABELS[code]) return KB_LABELS[code];
    if (code.startsWith('Key')) return code[3];
    if (code.startsWith('Digit')) return code[5];
    return code;
}

// ── Main Component ──
export default function TestLaptopPage() {
    const [activeTest, setActiveTest] = useState<string | null>(null);

    return (
        <div className={s.page}>
            <section className={s.hero}>
                <div className={s.heroInner}>
                    <div className={s.heroBadge}><Monitor size={14} /> Công cụ miễn phí</div>
                    <h1 className={s.heroTitle}>
                        Test Chức Năng<br /><span>Laptop Online</span>
                    </h1>
                    <p className={s.heroDesc}>
                        Kiểm tra hardware laptop ngay trên trình duyệt — không cần cài đặt.<br />
                        Webcam, loa, bàn phím, màn hình, pin và nhiều hơn nữa.
                    </p>
                </div>
            </section>

            {!activeTest ? (
                <section className={s.gridSection}>
                    <div className={s.grid}>
                        {TESTS.map(t => (
                            <button key={t.id} className={s.card} onClick={() => setActiveTest(t.id)}>
                                <div className={s.cardIcon}>{t.icon}</div>
                                <h3>{t.title}</h3>
                                <p>{t.desc}</p>
                                <div className={s.cardAction}>Bắt đầu test →</div>
                            </button>
                        ))}
                    </div>
                </section>
            ) : (
                <section className={s.testSection}>
                    <button className={s.backBtn} onClick={() => setActiveTest(null)}>
                        <ChevronLeft size={18} /> Quay lại
                    </button>
                    <TestRunner testId={activeTest} />
                </section>
            )}
        </div>
    );
}

// ── Test Runner ──
function TestRunner({ testId }: { testId: string }) {
    switch (testId) {
        case 'webcam': return <WebcamTest />;
        case 'mic': return <MicTest />;
        case 'audio': return <AudioTest />;
        case 'display': return <DisplayTest />;
        case 'keyboard': return <KeyboardTest />;
        default: return null;
    }
}

function StatusBadge({ status }: { status: TestStatus }) {
    if (status === 'idle') return null;
    if (status === 'running') return <span className={s.badge + ' ' + s.badgeRunning}>⏳ Đang test...</span>;
    if (status === 'pass') return <span className={s.badge + ' ' + s.badgePass}><CheckCircle size={14} /> PASS</span>;
    return <span className={s.badge + ' ' + s.badgeFail}><XCircle size={14} /> FAIL</span>;
}

// ══════════════════════════════════════════════
// 1. WEBCAM
// ══════════════════════════════════════════════
function WebcamTest() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<TestStatus>('idle');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);

    const start = async () => {
        try {
            setStatus('running');
            const s = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
            setStatus('pass');
        } catch { setStatus('fail'); }
    };

    const capture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        setPhoto(canvas.toDataURL('image/png'));
    };

    const stop = () => {
        stream?.getTracks().forEach(t => t.stop());
        setStream(null);
        setStatus('idle');
        setPhoto(null);
    };

    useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, [stream]);

    return (
        <div className={s.testPanel}>
            <div className={s.testHeader}>
                <h2><Camera size={24} /> Webcam Test</h2>
                <StatusBadge status={status} />
            </div>
            <div className={s.testBody}>
                <div className={s.videoContainer}>
                    <video ref={videoRef} autoPlay playsInline muted className={s.video} />
                </div>
                {photo && <LazyImage src={photo} alt="Captured" className={s.capturedPhoto} />}
                <div className={s.testActions}>
                    {!stream ? (
                        <button className={s.btnCyan} onClick={start}><Play size={16} /> Mở Camera</button>
                    ) : (
                        <>
                            <button className={s.btnCyan} onClick={capture}><Camera size={16} /> Chụp ảnh</button>
                            <button className={s.btnGhost} onClick={stop}><Square size={16} /> Tắt Camera</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════
// 2. MICROPHONE
// ══════════════════════════════════════════════
function MicTest() {
    const [status, setStatus] = useState<TestStatus>('idle');
    const [level, setLevel] = useState(0);
    const [recording, setRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const rafRef = useRef<number>(0);

    const start = async () => {
        try {
            setStatus('running');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const ctx = new AudioContext();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioUrl(URL.createObjectURL(blob));
            };
            recorderRef.current = recorder;
            recorder.start();
            setRecording(true);
            setStatus('pass');

            const tick = () => {
                const data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b, 0) / data.length;
                setLevel(avg / 255 * 100);
                rafRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch { setStatus('fail'); }
    };

    const stop = () => {
        recorderRef.current?.stop();
        streamRef.current?.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(rafRef.current);
        setRecording(false);
        setLevel(0);
    };

    useEffect(() => () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className={s.testPanel}>
            <div className={s.testHeader}>
                <h2><Mic size={24} /> Microphone Test</h2>
                <StatusBadge status={status} />
            </div>
            <div className={s.testBody}>
                <div className={s.vuMeter}>
                    <div className={s.vuFill} style={{ width: `${level}%` }} />
                    <span>{Math.round(level)}%</span>
                </div>
                {audioUrl && (
                    <audio controls src={audioUrl} className={s.audioPlayer} />
                )}
                <div className={s.testActions}>
                    {!recording ? (
                        <button className={s.btnCyan} onClick={start}><Mic size={16} /> Thu âm</button>
                    ) : (
                        <button className={s.btnMagenta} onClick={stop}><Square size={16} /> Dừng</button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════
// 3. AUDIO / SPEAKER
// ══════════════════════════════════════════════
function AudioTest() {
    const [status, setStatus] = useState<TestStatus>('idle');
    const [customAudio, setCustomAudio] = useState<string | null>(null);
    const ctxRef = useRef<AudioContext | null>(null);
    const [balance, setBalance] = useState(0); // -1 (Left) to 1 (Right)
    const audioRef = useRef<HTMLAudioElement>(null);
    const pannerRef = useRef<StereoPannerNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    const playTone = (freq: number, pan: number, duration = 1) => {
        setStatus('running');
        const ctx = ctxRef.current || new AudioContext();
        ctxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner();
        osc.frequency.value = freq;
        gain.gain.value = 0.3;
        panner.pan.value = pan;
        osc.connect(gain).connect(panner).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
        osc.onended = () => setStatus('pass');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (customAudio) URL.revokeObjectURL(customAudio);
            setCustomAudio(URL.createObjectURL(file));
            setStatus('pass');
        }
    };

    const useSystemAudio = () => {
        setCustomAudio('/audio/music_test.mp3');
        setStatus('pass');
    };

    // Setup Web Audio for the audio element
    useEffect(() => {
        if (!audioRef.current || !customAudio) return;

        const ctx = ctxRef.current || new AudioContext();
        ctxRef.current = ctx;

        if (!sourceRef.current) {
            sourceRef.current = ctx.createMediaElementSource(audioRef.current);
            pannerRef.current = ctx.createStereoPanner();
            sourceRef.current.connect(pannerRef.current).connect(ctx.destination);
        }

        if (pannerRef.current) {
            pannerRef.current.pan.value = balance;
        }

        const resume = () => { if (ctx.state === 'suspended') ctx.resume(); };
        audioRef.current.addEventListener('play', resume);
        return () => audioRef.current?.removeEventListener('play', resume);
    }, [customAudio, balance]);

    useEffect(() => () => {
        if (customAudio) URL.revokeObjectURL(customAudio);
    }, [customAudio]);

    return (
        <div className={s.testPanel}>
            <div className={s.testHeader}>
                <h2><Volume2 size={24} /> Audio / Speaker Test</h2>
                <StatusBadge status={status} />
            </div>
            <div className={s.testBody}>
                <p className={s.testHint}>Bấm các nút để test từng kênh âm thanh</p>
                <div className={s.audioGrid}>
                    <button className={s.btnCyan} onClick={() => playTone(440, -1)}>🔊 Loa Trái</button>
                    <button className={s.btnCyan} onClick={() => playTone(440, 1)}>🔊 Loa Phải</button>
                    <button className={s.btnCyan} onClick={() => playTone(440, 0)}>🔊 Stereo</button>
                    <button className={s.btnMagenta} onClick={() => playTone(80, 0, 2)}>🔊 Bass Test</button>
                </div>

                <div className={s.uploadSection}>
                    <div className={s.divider} />
                    <p className={s.testHint}>Hoặc sử dụng nhạc test của hệ thống:</p>
                    <div className={s.uploadControls}>
                        <div className={s.btnGroup}>
                            <button className={s.btnSystem} onClick={useSystemAudio}>
                                <Play size={16} /> DÙNG NHẠC HỆ THỐNG
                            </button>
                            
                            <input 
                                type="file" 
                                accept="audio/*" 
                                id="audio-upload"
                                onChange={handleFileUpload}
                                className={s.hiddenInput}
                            />
                            <label htmlFor="audio-upload" className={s.uploadLabel}>
                                <RotateCcw size={14} /> TẢI LÊN FILE KHÁC
                            </label>
                        </div>
                        
                        {customAudio && (
                            <div className={s.playerWrapper}>
                                <div className={s.playerHeader}>
                                    <audio 
                                        ref={audioRef}
                                        controls 
                                        src={customAudio} 
                                        className={s.audioPlayer} 
                                        crossOrigin="anonymous"
                                    />
                                    {customAudio.includes('soundhelix') && (
                                        <p className={s.playingHint}>Nhạc test hệ thống</p>
                                    )}
                                </div>

                                <div className={s.pannerControl}>
                                    <div className={s.pannerLabels}>
                                        <span>TRÁI</span>
                                        <span>CÂN BẰNG</span>
                                        <span>PHẢI</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="-1" 
                                        max="1" 
                                        step="0.01" 
                                        value={balance} 
                                        onChange={(e) => setBalance(parseFloat(e.target.value))}
                                        className={s.pannerSlider}
                                    />
                                    <div className={s.pannerValues}>
                                        <span>{balance < 0 ? `${Math.round(Math.abs(balance) * 100)}%` : '0%'}</span>
                                        <span>{balance === 0 ? 'Stereo' : '0%'}</span>
                                        <span>{balance > 0 ? `${Math.round(balance * 100)}%` : '0%'}</span>
                                    </div>

                                    <div className={s.quickPan}>
                                        <button 
                                            className={`${s.panBtn} ${balance === -1 ? s.panActive : ''}`}
                                            onClick={() => setBalance(-1)}
                                        >Chỉ Loa Trái</button>
                                        <button 
                                            className={`${s.panBtn} ${balance === 0 ? s.panActive : ''}`}
                                            onClick={() => setBalance(0)}
                                        >Cả Hai (Stereo)</button>
                                        <button 
                                            className={`${s.panBtn} ${balance === 1 ? s.panActive : ''}`}
                                            onClick={() => setBalance(1)}
                                        >Chỉ Loa Phải</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════
// 4. DISPLAY
// ══════════════════════════════════════════════
function DisplayTest() {
    const [fullColor, setFullColor] = useState<string | null>(null);
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000'];
    const labels = ['Đỏ', 'Xanh lá', 'Xanh dương', 'Trắng', 'Đen'];

    const info = typeof window !== 'undefined' ? {
        width: window.screen.width,
        height: window.screen.height,
        dpr: window.devicePixelRatio,
        colorDepth: window.screen.colorDepth,
    } : null;

    if (fullColor) {
        return (
            <div
                className={s.fullscreenColor}
                style={{ background: fullColor }}
                onClick={() => { document.exitFullscreen?.(); setFullColor(null); }}
            >
                <p className={s.fullscreenHint} style={{ color: fullColor === '#FFFFFF' || fullColor === '#00FF00' ? '#000' : '#fff' }}>
                    Nhấn để thoát — Kiểm tra điểm chết trên toàn màn hình
                </p>
            </div>
        );
    }

    return (
        <div className={s.testPanel}>
            <div className={s.testHeader}>
                <h2><Monitor size={24} /> Display Test</h2>
                <StatusBadge status="pass" />
            </div>
            <div className={s.testBody}>
                {info && (
                    <div className={s.infoGrid}>
                        <div className={s.infoItem}><span>Resolution</span><strong>{info.width} × {info.height}</strong></div>
                        <div className={s.infoItem}><span>Device Pixel Ratio</span><strong>{info.dpr}x</strong></div>
                        <div className={s.infoItem}><span>Color Depth</span><strong>{info.colorDepth}-bit</strong></div>
                    </div>
                )}
                <p className={s.testHint}>Bấm màu để fullscreen — kiểm tra dead pixel</p>
                <div className={s.colorGrid}>
                    {colors.map((c, i) => (
                        <button
                            key={c}
                            className={s.colorBtn}
                            style={{ background: c, border: c === '#FFFFFF' ? '1px solid #ccc' : 'none' }}
                            onClick={() => { document.documentElement.requestFullscreen?.(); setFullColor(c); }}
                        >
                            <Maximize size={16} style={{ color: c === '#FFFFFF' || c === '#00FF00' ? '#000' : '#fff' }} />
                            <span style={{ color: c === '#FFFFFF' || c === '#00FF00' ? '#000' : '#fff' }}>{labels[i]}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════
// 5. KEYBOARD (Full-size layout)
// ══════════════════════════════════════════════
function KeyboardTest() {
    const [pressed, setPressed] = useState<Set<string>>(new Set());
    const [current, setCurrent] = useState<Set<string>>(new Set());

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            e.preventDefault();
            setCurrent(prev => new Set(prev).add(e.code));
            setPressed(prev => new Set(prev).add(e.code));
        };
        const up = (e: KeyboardEvent) => {
            e.preventDefault();
            setCurrent(prev => {
                const next = new Set(prev);
                next.delete(e.code);
                return next;
            });
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    const tested = ALL_KEYS.filter(k => pressed.has(k)).length;

    const renderKey = (code: string) => {
        if (!code) return <div key={Math.random()} className={s.keyGap} />;
        return (
            <div
                key={code}
                className={
                    s.key +
                    (pressed.has(code) ? ' ' + s.keyPressed : '') +
                    (current.has(code) ? ' ' + s.keyActive : '') +
                    (code === 'Space' ? ' ' + s.keySpace : '') +
                    (code === 'Numpad0' ? ' ' + s.keyNum0 : '') +
                    (code === 'NumpadAdd' || code === 'NumpadEnter' ? ' ' + s.keyTall : '') +
                    (WIDE_KEYS.has(code) ? ' ' + s.keyWide : '')
                }
            >
                {getKeyLabel(code)}
            </div>
        );
    };

    return (
        <div className={s.testPanel}>
            <div className={s.testHeader}>
                <h2><Keyboard size={24} /> Keyboard Test</h2>
                <span className={s.badge + ' ' + s.badgePass}>{tested}/{ALL_KEYS.length} phím</span>
            </div>
            <div className={s.testBody}>
                <p className={s.testHint}>Nhấn từng phím để kiểm tra — phím đã test sẽ sáng lên</p>
                <div className={s.keyboardFull}>
                    {/* Main keyboard area */}
                    <div className={s.kbMain}>
                        {/* Function row */}
                        <div className={s.kbRow}>
                            {KB_FUNC_ROW.map((code, i) => code ? renderKey(code) : <div key={`gap-${i}`} className={s.keyGap} />)}
                        </div>
                        {/* Main rows */}
                        {KB_ROWS_MAIN.map((row, ri) => (
                            <div key={ri} className={s.kbRow}>
                                {row.map(code => renderKey(code))}
                            </div>
                        ))}
                    </div>

                    {/* Nav cluster + Arrows */}
                    <div className={s.kbNav}>
                        <div className={s.kbRow}>{KB_NAV_TOP.map(c => renderKey(c))}</div>
                        <div className={s.kbRow}>{KB_NAV_MID.map(c => renderKey(c))}</div>
                        <div className={s.kbRow}>{KB_NAV_BOT.map(c => renderKey(c))}</div>
                        <div className={s.kbArrows}>
                            <div className={s.kbRow}>{renderKey('ArrowUp')}</div>
                            <div className={s.kbRow}>
                                {renderKey('ArrowLeft')}
                                {renderKey('ArrowDown')}
                                {renderKey('ArrowRight')}
                            </div>
                        </div>
                    </div>

                    {/* Numpad */}
                    <div className={s.kbNumpad}>
                        {KB_NUM_ROWS.map((row, ri) => (
                            <div key={ri} className={s.kbRow}>
                                {row.map(code => renderKey(code))}
                            </div>
                        ))}
                    </div>
                </div>
                <button className={s.btnGhost} onClick={() => { setPressed(new Set()); setCurrent(new Set()); }}>
                    <RotateCcw size={14} /> Reset
                </button>
            </div>
        </div>
    );
}
