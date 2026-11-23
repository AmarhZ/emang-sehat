'use client';
import { useEffect, useRef, useState } from 'react';

export default function CameraCapture({ onCapture, onClose }: { onCapture: (dataUrl: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let dead = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Browser ini tidak mendukung kamera, atau halaman tidak memakai HTTPS. Gunakan unggah gambar.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (dead) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (video.current) { video.current.srcObject = stream; await video.current.play(); setReady(true); }
      } catch (e) {
        const n = (e as DOMException).name;
        setError(
          n === 'NotAllowedError' ? 'Izin kamera ditolak. Izinkan kamera lewat ikon gembok di address bar, lalu coba lagi.'
          : n === 'NotFoundError' ? 'Kamera tidak ditemukan di perangkat ini. Gunakan unggah gambar.'
          : 'Kamera tidak bisa dibuka. Pastikan tidak sedang dipakai aplikasi lain.',
        );
      }
    })();
    return () => { dead = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  function snap() {
    const el = video.current;
    if (!el || !el.videoWidth) return;
    const s = Math.min(1, 1600 / Math.max(el.videoWidth, el.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(el.videoWidth * s);
    c.height = Math.round(el.videoHeight * s);
    c.getContext('2d')!.drawImage(el, 0, 0, c.width, c.height);
    onCapture(c.toDataURL('image/jpeg', 0.88));
  }

  return (
    <div>
      {error ? (
        <p className="err" role="alert">{error}</p>
      ) : (
        <div className="cam">
          <video ref={video} playsInline muted aria-label="Pratinjau kamera" />
          <div className="frame" aria-hidden="true" />
        </div>
      )}
      <p className="hint" style={{ margin: '8px auto' }}>Arahkan ke tabel “Informasi Nilai Gizi” sampai teksnya jelas dan tidak silau, lalu ambil foto.</p>
      <p style={{ margin: 0 }}>
        {!error && <button type="button" className="btn" onClick={snap} disabled={!ready}>{ready ? 'Ambil foto & scan' : 'Menyiapkan kamera…'}</button>}{' '}
        <button type="button" className="btn alt" onClick={onClose}>Tutup kamera</button>
      </p>
    </div>
  );
}
