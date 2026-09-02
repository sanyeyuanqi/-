'use client';

import { Check, ChevronRight, Loader2, RefreshCcw, X } from 'lucide-react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type SlideChallenge = {
  captcha_key: string;
  image_base64: string;
  thumb_base64: string;
  image_width: number;
  image_height: number;
  tile_width: number;
  tile_height: number;
  tile_y: number;
};

type Props = {
  language: 'zh' | 'en';
  request: <T>(path: string, init?: RequestInit & { fresh?: boolean }) => Promise<T>;
  onVerified: (token: string, signal: AbortSignal) => Promise<void>;
  onClose: () => void;
};

const translations = {
  zh: {
    title: '安全验证',
    hint: '拖动拼图贴合缺口，松手校验',
    verified: '验证通过',
    loading: '正在加载验证码',
    checking: '正在验证',
    loadFailed: '验证码加载失败，请刷新重试',
    failed: '验证失败，请重试',
    refresh: '刷新验证码',
    close: '关闭',
    puzzle: '滑块验证拼图',
    slider: '拖动滑块完成验证',
    keyboard: '方向键移动拼图，回车键校验',
  },
  en: {
    title: 'Security check',
    hint: 'Drag the piece into the gap, then release',
    verified: 'Verified',
    loading: 'Loading captcha',
    checking: 'Verifying',
    loadFailed: 'Failed to load captcha. Please refresh to retry.',
    failed: 'Verification failed. Please try again.',
    refresh: 'Refresh captcha',
    close: 'Close',
    puzzle: 'Slider verification puzzle',
    slider: 'Drag the slider to verify',
    keyboard: 'Move with the arrow keys, then press Enter to verify',
  },
};

function imageSource(value: string) {
  return value.startsWith('data:') ? value : `data:image/png;base64,${value}`;
}

function isValidChallenge(data: SlideChallenge) {
  return Boolean(
    data?.captcha_key && data.image_base64 && data.thumb_base64 &&
    Number.isFinite(data.image_width) && data.image_width > 0 &&
    Number.isFinite(data.image_height) && data.image_height > 0 &&
    Number.isFinite(data.tile_width) && data.tile_width > 0 && data.tile_width < data.image_width &&
    Number.isFinite(data.tile_height) && data.tile_height > 0 &&
    Number.isFinite(data.tile_y) && data.tile_y >= 0 &&
    data.tile_y + data.tile_height <= data.image_height
  );
}

export default function LoginCaptcha({ language, request, onVerified, onClose }: Props) {
  const copy = translations[language];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const revisionRef = useRef(0);
  const lockedRef = useRef(true);
  const positionRef = useRef(0);
  const dragRef = useRef<{ pointerId: number; startClientX: number; startX: number; moved: number } | null>(null);
  const [challenge, setChallenge] = useState<SlideChallenge | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'checking' | 'verified' | 'error'>('loading');
  const [position, setPosition] = useState(0);
  const [error, setError] = useState('');
  const [imagesReady, setImagesReady] = useState({ background: false, tile: false });

  const loadChallenge = useCallback(async (message = '') => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const revision = ++revisionRef.current;
    lockedRef.current = true;
    dragRef.current = null;
    positionRef.current = 0;
    setPosition(0);
    setChallenge(null);
    setImagesReady({ background: false, tile: false });
    setPhase('loading');
    setError(message);
    try {
      const data = await request<SlideChallenge>('/api/auth/captcha/slide', {
        fresh: true,
        signal: controller.signal,
      });
      if (revision !== revisionRef.current) return;
      if (!isValidChallenge(data)) throw new Error(copy.loadFailed);
      setChallenge(data);
      setPhase('ready');
      lockedRef.current = false;
    } catch (failure) {
      if (revision !== revisionRef.current || controller.signal.aborted) return;
      setPhase('error');
      setError(failure instanceof Error ? failure.message : copy.loadFailed);
    }
  }, [request, copy.loadFailed]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    void loadChallenge();
    return () => {
      revisionRef.current += 1;
      controllerRef.current?.abort();
      dragRef.current = null;
    };
  }, [loadChallenge]);

  const busy = phase === 'checking' || phase === 'verified';
  const canDrag = phase === 'ready' && imagesReady.background && imagesReady.tile;
  const maximum = challenge ? challenge.image_width - challenge.tile_width : 0;

  function moveTo(next: number) {
    const clamped = Math.min(maximum, Math.max(0, next));
    positionRef.current = clamped;
    setPosition(clamped);
  }

  async function verify() {
    if (!challenge || !canDrag || lockedRef.current) return;
    lockedRef.current = true;
    setPhase('checking');
    setError('');
    const revision = revisionRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const result = await request<{ captcha_token: string }>('/api/auth/captcha/slide/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          captcha_key: challenge.captcha_key,
          x: Math.round(positionRef.current),
          y: challenge.tile_y,
        }),
        signal: controller.signal,
      });
      if (revision !== revisionRef.current || controller.signal.aborted) return;
      if (!result?.captcha_token || typeof result.captcha_token !== 'string') throw new Error(copy.failed);
      setPhase('verified');
      await onVerified(result.captcha_token, controller.signal);
    } catch (failure) {
      if (revision !== revisionRef.current || controller.signal.aborted) return;
      const message = failure instanceof Error ? failure.message : copy.failed;
      if (failure && typeof failure === 'object' && 'status' in failure && failure.status === 429) {
        setChallenge(null);
        setPhase('error');
        setError(message);
      } else {
        // A checked challenge or login token cannot be reused, even after a failed login.
        await loadChallenge(message);
      }
    }
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canDrag || lockedRef.current || !event.isPrimary || event.button !== 0 || dragRef.current) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startX: positionRef.current,
      moved: 0,
    };
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const width = stageRef.current?.getBoundingClientRect().width;
    if (!drag || drag.pointerId !== event.pointerId || !width || !challenge) return;
    const delta = event.clientX - drag.startClientX;
    drag.moved = Math.max(drag.moved, Math.abs(delta));
    // The server checks original image pixels, not the scaled CSS pixels on a phone.
    moveTo(drag.startX + delta * challenge.image_width / width);
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    pointerMove(event);
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved >= 12) void verify();
  }

  function keyboardMove(event: KeyboardEvent<HTMLDivElement>) {
    if (!canDrag || lockedRef.current) return;
    const step = event.shiftKey ? 10 : 1;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') moveTo(positionRef.current - step);
    else if (event.key === 'ArrowRight') moveTo(positionRef.current + step);
    else if (event.key === 'Home') moveTo(0);
    else if (event.key === 'End') moveTo(maximum);
    else void verify();
  }

  function imageFailed() {
    lockedRef.current = true;
    setPhase('error');
    setError(copy.loadFailed);
  }

  const pointerHandlers = {
    onPointerDown: pointerDown,
    onPointerMove: pointerMove,
    onPointerUp: pointerUp,
    onPointerCancel: () => { dragRef.current = null; },
    onLostPointerCapture: () => { dragRef.current = null; },
  };

  return (
    <dialog
      ref={dialogRef}
      className="login-captcha-dialog"
      aria-labelledby="login-captcha-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || busy) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
    >
      <header className="login-captcha-header">
        <h2 id="login-captcha-title">{copy.title}</h2>
        <button type="button" className="login-captcha-icon" aria-label={copy.close} title={copy.close} disabled={busy} onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      <div className="login-captcha-toolbar">
        <span className={phase === 'verified' ? 'verified' : ''} aria-live="polite">
          {phase === 'verified' ? copy.verified : copy.hint}
        </span>
        <button type="button" className="login-captcha-icon" aria-label={copy.refresh} title={copy.refresh} disabled={phase === 'loading' || busy} onClick={() => void loadChallenge()}>
          <RefreshCcw size={15} />
        </button>
      </div>
      <div className="login-captcha-puzzle" aria-busy={phase === 'loading' || busy}>
        <div
          ref={stageRef}
          className="login-captcha-stage"
          role="img"
          aria-label={copy.puzzle}
          style={{ aspectRatio: `${challenge?.image_width || 300} / ${challenge?.image_height || 220}` }}
          {...pointerHandlers}
        >
          {challenge && <>
            {/* The upstream provides one-time base64 images, not optimizable static assets. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={`${challenge.captcha_key}-background`} alt="" draggable={false} src={imageSource(challenge.image_base64)} className="login-captcha-background" onLoad={() => setImagesReady((current) => ({ ...current, background: true }))} onError={imageFailed} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={`${challenge.captcha_key}-tile`} alt="" draggable={false} src={imageSource(challenge.thumb_base64)} className="login-captcha-tile" onLoad={() => setImagesReady((current) => ({ ...current, tile: true }))} onError={imageFailed} style={{
              left: `${position / challenge.image_width * 100}%`,
              top: `${challenge.tile_y / challenge.image_height * 100}%`,
              width: `${challenge.tile_width / challenge.image_width * 100}%`,
              height: `${challenge.tile_height / challenge.image_height * 100}%`,
            }} />
          </>}
        </div>
        <div
          className={`login-captcha-track${phase === 'verified' ? ' verified' : ''}`}
          role="slider"
          tabIndex={canDrag ? 0 : -1}
          aria-label={copy.slider}
          aria-describedby="login-captcha-keyboard"
          aria-valuemin={0}
          aria-valuemax={maximum}
          aria-valuenow={Math.round(position)}
          aria-disabled={!canDrag}
          onKeyDown={keyboardMove}
          {...pointerHandlers}
        >
          <span className="login-captcha-thumb" style={{
            left: `${challenge ? position / challenge.image_width * 100 : 0}%`,
            width: `${challenge ? challenge.tile_width / challenge.image_width * 100 : 16}%`,
          }}>{phase === 'verified' ? <Check size={19} /> : <ChevronRight size={19} />}</span>
        </div>
        <span id="login-captcha-keyboard" className="sr-only">{copy.keyboard}</span>
        {(phase === 'loading' || busy || (phase === 'ready' && !canDrag)) && (
          <div className="login-captcha-loading" role="status">
            <Loader2 size={24} className="spin" />
            <span>{busy ? (phase === 'verified' ? copy.verified : copy.checking) : copy.loading}</span>
          </div>
        )}
      </div>
      {error && <div className="login-captcha-error" role="alert">{error}</div>}
    </dialog>
  );
}
