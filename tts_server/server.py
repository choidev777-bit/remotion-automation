"""
Qwen3-TTS Voice Clone 서버
- Next.js app/api/tts/route.ts 와 호환 (POST /api/predict)
- GTX 1660 전용 설정 (float16, FlashAttention 없음)
"""
import io, base64, os
import torch
import soundfile as sf
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from qwen_tts import Qwen3TTSModel

# ── 설정값 ───────────────────────────────────────
# server.py 파일이 있는 폴더 기준 절대 경로
_DIR = os.path.dirname(os.path.abspath(__file__))
REF_AUDIO = os.path.join(_DIR, "my_voice.wav")
REF_TEXT  = "안녕하세요, 저는 AI 기술과 생산성에 관한 유튜브 채널을 운영하고 있습니다. 오늘은 여러분께 정말 흥미로운 주제를 가져왔는데요. 함께 알아보도록 하겠습니다. 끝까지 시청해주셔서 감사합니다."
# ─────────────────────────────────────────────────

app = FastAPI()

print("=" * 50)
print("Qwen3-TTS 모델 로딩 중...")
print("(처음 실행 시 ~1.5GB 다운로드, 수 분 소요)")
print("=" * 50)

model = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
    device_map="cuda:0",
    dtype=torch.float16,  # GTX 1660: bfloat16 미지원
)

print("Voice Clone 프롬프트 생성 중...")
voice_clone_prompt = model.create_voice_clone_prompt(
    ref_audio=REF_AUDIO,
    ref_text=REF_TEXT,
)
print("✅ 서버 준비 완료! localhost:7860 실행 중")


class GradioRequest(BaseModel):
    data: list


@app.post("/api/predict")
async def predict(req: GradioRequest):
    text = req.data[0]
    if not text or not text.strip():
        return {"error": "텍스트가 비어 있습니다"}

    print(f"TTS 생성 중... ({len(text)}자)")

    wavs, sr = model.generate_voice_clone(
        text=text,
        language="Korean",
        voice_clone_prompt=voice_clone_prompt,
    )

    buffer = io.BytesIO()
    sf.write(buffer, wavs[0], sr, format="WAV")
    audio_b64 = base64.b64encode(buffer.getvalue()).decode()

    print("✅ TTS 완료")
    return {"data": [{"data": f"data:audio/wav;base64,{audio_b64}"}]}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
