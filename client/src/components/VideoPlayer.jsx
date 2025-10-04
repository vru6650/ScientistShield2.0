import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

function formatTime(s) {
  if (!Number.isFinite(s)) return '0:00';
  const total = Math.max(0, Math.floor(s));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function VideoPlayer({ src, poster, title, storageKey, className = '' }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [theater, setTheater] = useState(false);
  const [resumeAt, setResumeAt] = useState(null);

  // Load resume position
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(`video-progress:${storageKey}`);
      const t = raw ? parseFloat(raw) : 0;
      if (Number.isFinite(t) && t > 10) setResumeAt(t);
    } catch (_) {}
  }, [storageKey]);

  // Persist position periodically
  useEffect(() => {
    const v = videoRef.current; if (!v || !storageKey) return;
    const onTime = () => {
      try { localStorage.setItem(`video-progress:${storageKey}`, String(v.currentTime)); } catch (_) {}
      setCurrentTime(v.currentTime);
    };
    const onLoaded = () => {
      setDuration(v.duration || 0);
      setReady(true);
    };
    const onEnded = () => {
      try { localStorage.removeItem(`video-progress:${storageKey}`); } catch (_) {}
      setPlaying(false);
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('ended', onEnded);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('ended', onEnded);
    };
  }, [storageKey]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  }, []);

  const handleSeek = (e) => {
    const v = videoRef.current; if (!v) return;
    const val = Number(e.target.value);
    const t = (val / 1000) * (v.duration || 0);
    v.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolume = (e) => {
    const v = videoRef.current; if (!v) return;
    const val = Math.min(1, Math.max(0, Number(e.target.value)));
    v.volume = val; setVolume(val); setMuted(val === 0 || v.muted);
  };

  const toggleMute = () => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  };

  const changeRate = () => {
    const v = videoRef.current; if (!v) return;
    const options = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const idx = options.indexOf(rate);
    const next = options[(idx + 1) % options.length];
    v.playbackRate = next; setRate(next);
  };

  const togglePiP = async () => {
    const v = videoRef.current; if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
      }
    } catch (_) {}
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  };

  const handleKey = useCallback((e) => {
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'j' || e.key === 'ArrowLeft') { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }
    else if (e.key === 'l' || e.key === 'ArrowRight') { const v = videoRef.current; if (v && v.duration) v.currentTime = Math.min(v.duration - 0.1, v.currentTime + 10); }
    else if (e.key === 'm') { toggleMute(); }
    else if (e.key === 'f') { toggleFullscreen(); }
    else if (e.key === 't') { setTheater((x) => !x); }
    else if (e.key === 'p') { togglePiP(); }
  }, [togglePlay]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const progress = useMemo(() => {
    const d = duration || videoRef.current?.duration || 0;
    return d > 0 ? Math.min(1000, Math.max(0, Math.round((currentTime / d) * 1000))) : 0;
  }, [currentTime, duration]);

  return (
    <div ref={containerRef} className={["video-player", theater ? 'video-player-theater' : '', className].filter(Boolean).join(' ')}>
      <div className="video-frame">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls={false}
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="video-el"
        />
        {!ready && (
          <div className="video-loading">Loading…</div>
        )}
        {resumeAt !== null && (
          <div className="video-resume">
            <span>Continue at {formatTime(resumeAt)}?</span>
            <button type="button" onClick={() => { const v = videoRef.current; if (!v) return; v.currentTime = resumeAt; setResumeAt(null); }}>Resume</button>
            <button type="button" onClick={() => setResumeAt(null)}>Dismiss</button>
          </div>
        )}
      </div>

      <div className="video-controls">
        <div className="video-controls-row">
          <button type="button" className="vc-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <div className="vc-time">{formatTime(currentTime)} / {formatTime(duration)}</div>
          <div className="vc-spacer" />
          <button type="button" className="vc-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolume} className="vc-volume" aria-label="Volume" />
          <button type="button" className="vc-btn" onClick={changeRate} aria-label="Playback speed">{rate}x</button>
          <button type="button" className="vc-btn" onClick={() => setTheater((x) => !x)} aria-label="Theater mode">Theater</button>
          <button type="button" className="vc-btn" onClick={togglePiP} aria-label="Picture in Picture">PiP</button>
          <button type="button" className="vc-btn" onClick={toggleFullscreen} aria-label="Fullscreen">Full</button>
        </div>
        <input type="range" min="0" max="1000" step="1" value={progress} onChange={handleSeek} className="vc-seek" aria-label="Seek" />
        {title && <div className="vc-title" title={title}>{title}</div>}
      </div>
    </div>
  );
}

VideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  poster: PropTypes.string,
  title: PropTypes.string,
  storageKey: PropTypes.string,
  className: PropTypes.string,
};

