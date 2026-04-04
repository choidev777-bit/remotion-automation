---
name: qwen3-tts-setup
description: >
  유튜브 자동화 시스템의 TTS(음성 합성) 서버를 설치하고 설정하는 스킬.
  Qwen3-TTS Voice Clone을 로컬 GPU에서 실행하여 Next.js 파이프라인과 연결한다.
  Windows + NVIDIA GPU 환경 기준. GTX 1660(6GB VRAM) 환경에서 검증됨.
---

# Qwen3-TTS Voice Clone 서버 설치 스킬

## 목적
유튜브 자동화 시스템(`youtube_generator`)에서 TTS(Text-to-Speech) 기능을 활성화한다.  
Qwen3-TTS의 Voice Clone 기능을 사용하여 모든 영상에서 동일한 목소리가 나오도록 설정한다.

---

## 사전 요구사항
- Windows OS
- NVIDIA GPU (VRAM 6GB 이상)
- CUDA 드라이버 설치됨 (`nvidia-smi` 명령으로 확인)
- 프로젝트 경로: `C:\Users\{사용자명}\Documents\youtube_generator`

---

## Step 1. CUDA 버전 확인

```powershell
nvidia-smi
```

→ 출력된 `CUDA Version`을 메모한다. (예: 12.7)

---

## Step 2. Miniconda 설치

```powershell
conda --version
```

→ `conda: command not found`이면 설치 필요:

```powershell
# Miniconda 다운로드 및 자동 설치
Invoke-WebRequest -Uri "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe" -OutFile "$env:TEMP\miniconda_installer.exe" -UseBasicParsing
Start-Process -FilePath "$env:TEMP\miniconda_installer.exe" -ArgumentList "/InstallationType=JustMe /RegisterPython=0 /S /D=$env:USERPROFILE\Miniconda3" -Wait
```

설치 후 **새 PowerShell 창**을 열어야 conda가 인식된다.

> **주의**: 설치에 3~5분 소요됨. 진행바 없이 기다려야 함.

---

## Step 3. conda 환경 생성

새 PowerShell에서 아래 명령 순서대로 실행:

```powershell
# TOS 동의 (3개 채널 모두)
C:\Users\{사용자명}\Miniconda3\Scripts\conda.exe tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
C:\Users\{사용자명}\Miniconda3\Scripts\conda.exe tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r
C:\Users\{사용자명}\Miniconda3\Scripts\conda.exe tos accept --override-channels --channel https://repo.anaconda.com/pkgs/msys2
```

```powershell
# Python 3.12 환경 생성 (1~3분 소요)
C:\Users\{사용자명}\Miniconda3\Scripts\conda.exe create -n qwen3-tts python=3.12 -y
```

> **중요**: PowerShell에서 전체 경로(`C:\Users\...`)로 conda를 실행해야 한다.  
> `conda activate` 명령은 PowerShell에서 직접 동작하지 않으므로, 이후 모든 명령은 전체 경로로 실행한다.

---

## Step 4. PyTorch CUDA 설치

CUDA 버전에 맞는 명령 선택:

**CUDA 12.4 ~ 12.7 (cu124 사용):**
```powershell
& "C:\Users\{사용자명}\Miniconda3\envs\qwen3-tts\Scripts\pip.exe" install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
```

**CUDA 11.8 (cu118 사용):**
```powershell
& "C:\Users\{사용자명}\Miniconda3\envs\qwen3-tts\Scripts\pip.exe" install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

> **주의**: 약 2.5GB 다운로드. 인터넷 속도에 따라 2~5분 소요.

CUDA 작동 확인:
```powershell
& "C:\Users\{사용자명}\Miniconda3\envs\qwen3-tts\python.exe" -c "import torch; print('CUDA:', torch.cuda.is_available())"
```
→ `CUDA: True` 출력되면 성공.

---

## Step 5. qwen-tts 및 서버 패키지 설치

```powershell
& "C:\Users\{사용자명}\Miniconda3\envs\qwen3-tts\Scripts\pip.exe" install -U qwen-tts fastapi uvicorn soundfile
```

> 약 75개 패키지 설치됨. 5분 내외 소요.

---

## Step 6. 목소리 샘플 녹음

Voice Clone에 사용할 기준 목소리를 녹음한다.

- **길이**: 15~30초
- **환경**: 조용한 곳, 마이크 가까이
- **형식**: WAV (Windows 음성 녹음기는 m4a → [온라인 변환](https://cloudconvert.com/m4a-to-wav)으로 WAV 변환)

**추천 녹음 문장:**
```
네, 안녕하세요, 저는 AI 기술과 생산성에 관한 유튜브 채널을 운영하고 있습니다.
오늘은 여러분께 정말 흥미로운 주제를 가져왔는데요.
함께 알아보도록 하겠습니다. 끝까지 시청해주셔서 감사합니다. 이상입니다.
```

**저장 위치:**
```
{프로젝트 경로}\tts_server\my_voice.wav
```

---

## Step 7. TTS 서버 스크립트 생성

`{프로젝트 경로}\tts_server\server.py` 파일 생성:

```python
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

# server.py 위치 기준 절대 경로 (CWD에 의존하지 않음)
_DIR = os.path.dirname(os.path.abspath(__file__))
REF_AUDIO = os.path.join(_DIR, "my_voice.wav")
REF_TEXT  = "네, 안녕하세요, 저는 AI 기술과 생산성에 관한 유튜브 채널을 운영하고 있습니다. 오늘은 여러분께 정말 흥미로운 주제를 가져왔는데요. 함께 알아보도록 하겠습니다. 끝까지 시청해주셔서 감사합니다. 이상입니다."

app = FastAPI()

print("=" * 50)
print("Qwen3-TTS 모델 로딩 중...")
print("(처음 실행 시 ~2.5GB 다운로드, 수 분 소요)")
print("=" * 50)

model = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
    device_map="cuda:0",
    dtype=torch.float16,  # GTX 1660은 bfloat16 미지원 → float16 사용
    # attn_implementation 생략 (GTX 1660은 FlashAttention 2 미지원)
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
```

---

## Step 8. 서버 실행

```powershell
& "C:\Users\{사용자명}\Miniconda3\envs\qwen3-tts\python.exe" "{프로젝트 경로}\tts_server\server.py"
```

**처음 실행 시**: HuggingFace에서 모델 파일 2.5GB 자동 다운로드 (2~5분)  
**두 번째 실행부터**: 캐시 사용으로 30초 내 기동

성공 메시지:
```
✅ 서버 준비 완료! localhost:7860 실행 중
INFO:     Uvicorn running on http://0.0.0.0:7860
```

동작 확인:
```powershell
Invoke-RestMethod -Uri "http://localhost:7860/health"
# → @{status=ok}
```

---

## 자주 발생하는 에러 및 해결법

| 에러 | 원인 | 해결 |
|---|---|---|
| `conda: command not found` | conda PATH 미등록 | 새 PowerShell 창 열기, 또는 전체 경로 사용 |
| `CondaToSNonInteractiveError` | TOS 미동의 | Step 3의 3개 TOS 명령 실행 |
| `OSError: No space left on device` | C 드라이브 여유 공간 부족 | 최소 4GB 확보 후 재실행 |
| `FileNotFoundError: my_voice.wav` | CWD가 tts_server가 아님 | server.py의 REF_AUDIO가 `__file__` 기반 절대경로인지 확인 |
| `bfloat16 not supported` | GTX 1660 dtype 오류 | `dtype=torch.float16` 사용 확인 |
| `CUDA: False` | PyTorch CUDA 버전 불일치 | CUDA 버전 재확인 후 cu118/cu124 선택 |

---

## GPU별 설정 차이

| GPU 세대 | dtype | attn_implementation | 권장 모델 |
|---|---|---|---|
| GTX 1660 (Turing) | `torch.float16` | 생략 | 0.6B-Base |
| RTX 3000+ (Ampere) | `torch.bfloat16` | `flash_attention_2` | 1.7B-Base |
| RTX 4000+ (Ada) | `torch.bfloat16` | `flash_attention_2` | 1.7B-Base |

---

## Next.js 연결 확인

`app/api/tts/route.ts`는 자동으로 `http://localhost:7860/api/predict`를 호출한다.  
서버 실행 상태에서 Next.js 앱으로 영상을 생성하면 오디오가 포함된다.

> **운영 규칙**: 영상 생성 전에 반드시 TTS 서버를 먼저 실행해야 한다.
