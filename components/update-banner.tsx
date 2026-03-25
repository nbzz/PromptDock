'use client';

import { useState, useEffect } from 'react';
import { VERSION } from '@/lib/version';

interface VersionInfo {
  version: string;
  changelog: Array<{ version: string; date: string; changes: string[] }>;
}

export function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedVersion = localStorage.getItem('update-dismissed-version');
    if (dismissedVersion === VERSION) {
      setDismissed(true);
      return;
    }

    fetch('/api/version')
      .then((res) => res.json())
      .then((data: VersionInfo) => {
        if (data.version !== VERSION) {
          setUpdateInfo(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    if (updateInfo) {
      localStorage.setItem('update-dismissed-version', updateInfo.version);
    }
    setDismissed(true);
  };

  if (dismissed || !updateInfo) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🚀</span>
          <div>
            <span className="font-medium">新版本可用</span>
            <span className="ml-2 text-blue-100">v{updateInfo.version}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChangelog(!showChangelog)}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            更新日志
          </button>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-white text-blue-500 hover:bg-blue-50 rounded transition-colors font-medium"
          >
            刷新页面
          </button>
          <button
            onClick={handleDismiss}
            className="px-2 py-1 text-sm text-blue-100 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      {showChangelog && (
        <div className="bg-blue-600 border-t border-blue-400">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <h3 className="font-medium mb-2">更新日志</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              {updateInfo.changelog.map((entry) => (
                <li key={entry.version}>
                  <span className="text-white font-medium">v{entry.version}</span>
                  <span className="ml-2 text-blue-200">({entry.date})</span>
                  <ul className="mt-1 ml-4 list-disc list-inside">
                    {entry.changes.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
