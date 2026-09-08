import { useState, useEffect } from 'react';
import { roomService } from '../services';
import { formatTime } from '../utils/constants';
import { toast } from './ToastContainer';

export default function VersionHistory({ versions, roomCode, onRestore }) {
  const [localVersions, setLocalVersions] = useState(versions);
  const [restoring, setRestoring] = useState(null);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    setLocalVersions(versions);
  }, [versions]);

  const handleRestore = async (version) => {
    setRestoring(version._id);
    try {
      const { data } = await roomService.restoreVersion(roomCode, version._id);
      onRestore({ code: data.code, language: data.language });
      toast.success('Version restored successfully');
      // Reload versions
      const { data: versionsData } = await roomService.getVersions(roomCode);
      setLocalVersions(versionsData);
    } catch (err) {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  if (!localVersions || localVersions.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📜</div>
        <p className="text-sm">No saved versions yet.</p>
        <p className="text-muted text-sm mt-1">
          Click "Save Version" to snapshot your code at any point.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>Code Version History</h3>
      {localVersions.map((v) => (
        <div key={v._id} className="version-item">
          <div className="version-header">
            <span className="version-label">
              {v.label || `Version`}
            </span>
            <span className="badge badge-info">{v.language}</span>
          </div>
          <div className="version-meta">
            By {v.savedByName} • {formatTime(v.createdAt)}
          </div>
          {viewing === v._id && (
            <div className="example mt-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
              <pre style={{ fontSize: 11 }}>{v.code}</pre>
            </div>
          )}
          <div className="version-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setViewing(viewing === v._id ? null : v._id)}
            >
              {viewing === v._id ? 'Hide' : 'View'}
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleRestore(v)}
              disabled={restoring === v._id}
            >
              {restoring === v._id ? 'Restoring...' : '↩ Restore'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
