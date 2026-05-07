// src/pages/Gallery.jsx
// Direct equivalent of buildGallery + uploadPhotos + loadPhotoManage + lightbox

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPhotos, deletePhoto, uploadPhotoRecord, onGallery } from '../services/firebase'
import { cloudinaryUpload } from '../services/cloudinary'
import styles from './Gallery.module.css'

export default function Gallery() {
  const { isAdmin } = useAuth()
  const [photos,   setPhotos]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [lightbox, setLightbox] = useState(null) // index or null

  // Upload state
  const [caption,   setCaption]   = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [status,    setStatus]    = useState('')
  const fileRef = useRef()

  // Live-sync gallery from Firebase
  useEffect(() => {
    const unsub = onGallery(pics => {
      setPhotos(pics)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Keyboard nav for lightbox
  useEffect(() => {
    function onKey(e) {
      if (lightbox === null) return
      if (e.key === 'ArrowRight') setLightbox(i => Math.min(i + 1, photos.length - 1))
      if (e.key === 'ArrowLeft')  setLightbox(i => Math.max(i - 1, 0))
      if (e.key === 'Escape')     setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, photos.length])

  async function handleUpload(e) {
    const fileList = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    if (!fileList.length) return

    setUploading(true)
    setProgress(0)
    setStatus(`Starting upload of ${fileList.length} photo${fileList.length > 1 ? 's' : ''}…`)

    let done = 0
    const errors = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      setStatus(`⏳ Uploading ${file.name} (${i + 1} of ${fileList.length})…`)

      let uploaded = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { url, public_id } = await cloudinaryUpload(file)
          const cap = fileList.length > 1 ? `${caption || 'TheRealists'} (${i+1}/${fileList.length})` : (caption || 'TheRealists')
          await uploadPhotoRecord(url, public_id, cap)
          uploaded = true
          break
        } catch(err) {
          if (attempt < 3) {
            setStatus(`⚠️ Retrying ${file.name} (attempt ${attempt + 1}/3)…`)
            await new Promise(r => setTimeout(r, attempt * 1000))
          } else {
            errors.push(`${file.name}: ${err.message}`)
          }
        }
      }

      if (uploaded) done++
      setProgress(Math.round(((i + 1) / fileList.length) * 100))
      if (i < fileList.length - 1) await new Promise(r => setTimeout(r, 400))
    }

    if (errors.length) {
      setStatus(`✅ ${done} uploaded. ⚠️ ${errors.length} failed:\n${errors.join('\n')}`)
    } else {
      setStatus(`✅ All ${done} photo${done > 1 ? 's' : ''} uploaded!`)
    }

    setCaption('')
    e.target.value = ''
    setUploading(false)
  }

  async function handleDelete(photo) {
    if (!confirm('Delete this photo?')) return
    await deletePhoto(photo._key)
    // onGallery listener will auto-update the grid
  }

  return (
    <div className="fade-in">
      <h1 className={styles.title}>Photo Gallery 📸</h1>
      <p className={styles.sub}>TheRealists in action — <span style={{color:'var(--accent3)'}}>memories worth keeping</span></p>

      {/* Upload panel — admin only */}
      {isAdmin && (
        <div className={`card ${styles.uploadCard}`}>
          <div className={styles.uploadTitle}>📤 Upload Group Photos</div>
          <input
            className="form-input"
            placeholder="Caption (e.g. TheRealists Study Session — May 2026)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <button
            className="btn btn-primary"
            onClick={() => fileRef.current.click()}
            disabled={uploading}
          >
            📁 Choose Photos
          </button>

          {uploading && (
            <div style={{ marginTop: 12 }}>
              <div className="upload-progress visible">
                <div className="upload-progress-fill" style={{ width: progress + '%' }} />
              </div>
              <div className="upload-status">{status}</div>
            </div>
          )}
          {!uploading && status && (
            <div className="upload-status" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{status}</div>
          )}
        </div>
      )}

      {/* Gallery grid */}
      <div className="section-title" style={{ marginTop: 24 }}>Group Photos</div>

      {loading ? (
        <div className="gallery-empty">⏳ Loading photos…</div>
      ) : photos.length === 0 ? (
        <div className="gallery-empty">📸 No photos yet. Upload via Settings → Upload Content.</div>
      ) : (
        <div className="gallery-grid">
          {photos.map((photo, i) => (
            <div key={photo._key} className="gallery-item" onClick={() => setLightbox(i)}>
              <img
                src={photo.src}
                alt={photo.caption}
                loading="lazy"
                onError={e => e.target.parentElement.style.display = 'none'}
              />
              <div className="gallery-item-overlay">
                <div className="gallery-item-caption">{photo.caption}</div>
              </div>
              {isAdmin && (
                <button
                  className={styles.deleteBtn}
                  onClick={ev => { ev.stopPropagation(); handleDelete(photo) }}
                >✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div className="lightbox open" onClick={() => setLightbox(null)}>
          <button className={styles.lbClose} onClick={() => setLightbox(null)}>✕</button>
          <button
            className={`${styles.lbNav} ${styles.lbPrev}`}
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.max(i-1, 0)) }}
            disabled={lightbox === 0}
          >‹</button>
          <img
            src={photos[lightbox].src}
            alt={photos[lightbox].caption}
            onClick={e => e.stopPropagation()}
          />
          <button
            className={`${styles.lbNav} ${styles.lbNext}`}
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.min(i+1, photos.length-1)) }}
            disabled={lightbox === photos.length - 1}
          >›</button>
          <div className={styles.lbCaption}>
            {photos[lightbox].caption} · {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  )
}
