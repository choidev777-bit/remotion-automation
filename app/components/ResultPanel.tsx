'use client';

type Props = {
  outputPath: string;
  jobId: string;
};

export function ResultPanel({ outputPath, jobId }: Props) {
  return (
    <div className="card">
      <div className="result-box">
        <div className="result-icon">🎉</div>
        <h2 className="result-title">영상이 완성되었습니다!</h2>
        <p className="result-subtitle">{outputPath}</p>
        <a
          id="download-btn"
          href={`/api/download?jobId=${jobId}`}
          className="btn-download"
          download={`${jobId}.mp4`}
        >
          📥&nbsp; MP4 다운로드
        </a>
      </div>
    </div>
  );
}
