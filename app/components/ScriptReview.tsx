'use client';

import React, { useState } from 'react';

interface ScriptReviewProps {
  script: string;
  onApprove: (finalScript: string) => void;
  onReject: () => void;
}

export const ScriptReview: React.FC<ScriptReviewProps> = ({
  script,
  onApprove,
  onReject,
}) => {
  const [editedScript, setEditedScript] = useState(script);
  const [isEditing, setIsEditing] = useState(false);

  const charCount = editedScript.length;
  // 한국어 평균 낭독 속도 약 200자/분
  const estimatedMinutes = Math.round((charCount / 200) * 10) / 10;

  return (
    <div className="script-review">
      <div className="script-review-header">
        <h2 className="script-review-title">📝 대본 검토</h2>
        <span className="script-meta">
          {charCount.toLocaleString()}자 &middot; 약 {estimatedMinutes}분 예상
        </span>
      </div>

      {isEditing ? (
        <textarea
          className="script-textarea"
          value={editedScript}
          onChange={(e) => setEditedScript(e.target.value)}
          rows={22}
          placeholder="대본을 직접 수정하세요..."
        />
      ) : (
        <div className="script-preview">
          {editedScript.split('\n').map((line, i) =>
            line.trim() ? <p key={i}>{line}</p> : <br key={i} />
          )}
        </div>
      )}

      <div className="script-actions">
        <button
          id="script-edit-toggle"
          className="btn btn-secondary"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? '👁 미리보기' : '✏️ 수정하기'}
        </button>
        <button
          id="script-reject"
          className="btn btn-danger"
          onClick={onReject}
        >
          🔄 다시 생성
        </button>
        <button
          id="script-approve"
          className="btn btn-primary"
          onClick={() => onApprove(editedScript)}
        >
          ✅ 승인 · 영상 생성 시작
        </button>
      </div>
    </div>
  );
};
