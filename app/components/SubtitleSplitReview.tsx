'use client';

import React, { useState } from 'react';

interface SubtitleSplitReviewProps {
  script: string;
  onApprove: (splitScript: string) => void;
  onBack: () => void;
}

/**
 * 자막 분할 리뷰 UI.
 * AI가 / 구분자를 삽입한 대본을 사용자가 수정할 수 있는 텍스트 에디터.
 */
export const SubtitleSplitReview: React.FC<SubtitleSplitReviewProps> = ({
  script,
  onApprove,
  onBack,
}) => {
  const [edited, setEdited] = useState(script);
  const chunkCount = edited.split('/').length;

  return (
    <div className="script-review">
      <div className="script-review-header">
        <h2 className="script-review-title">✂️ 자막 분할 검토</h2>
        <span className="script-meta">
          자막 청크 {chunkCount}개
        </span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
        AI가 의미 단위로 <code style={{ color: 'var(--primary)', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>/</code> 구분자를 삽입했습니다.
        위치가 마음에 들지 않으면 직접 수정하세요.
      </p>

      <textarea
        className="script-textarea"
        value={edited}
        onChange={(e) => setEdited(e.target.value)}
        rows={22}
        placeholder="/ 위치를 수정하세요..."
        style={{ whiteSpace: 'pre-wrap' }}
      />

      <div className="script-actions">
        <button
          id="subtitle-split-back"
          className="btn btn-secondary"
          onClick={onBack}
        >
          ← 대본으로 돌아가기
        </button>
        <button
          id="subtitle-split-approve"
          className="btn btn-primary"
          onClick={() => onApprove(edited)}
        >
          ✅ 승인 · 씬 분할 시작
        </button>
      </div>
    </div>
  );
};
