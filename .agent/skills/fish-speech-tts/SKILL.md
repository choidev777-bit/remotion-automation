---
name: fish-speech-tts
description: Fish Speech v1.5 로컬 TTS 음성 생성 스킬. 레퍼런스 음성 관리, 단건/대량 TTS 생성, 속도 조절 및 볼륨 정규화를 처리합니다. 사용자가 대본을 제공하면 바로 TTS를 생성할 수 있습니다.
---

# Fish Speech TTS 스킬

## 환경 정보

| 항목 | 값 |
|------|-----|
| Conda 환경 | `fish-speech` (Python 3.10) |
| Python 경로 | `C:\Users\thisi\miniconda3\envs\fish-speech\python.exe` |
| 프로젝트 경로 | `c:\Users\thisi\Documents\youtube_generator\fish-speech` |
| API 포트 | `8080` |
| GPU | GTX 1660 (--half 모드) |
| 레퍼런스 경로 | `references/my_voice/my_voice.wav` + `my_voice.lab` |

## 1. API 서버 시작

TTS 생성 전 반드시 Fish Speech API 서버가 실행 중이어야 합니다.

### 서버 실행 명령어

```powershell
cd c:\Users\thisi\Documents\youtube_generator\fish-speech
& "C:\Users\thisi\miniconda3\envs\fish-speech\python.exe" -m tools.api_server --listen 0.0.0.0:8080 --llama-checkpoint-path "checkpoints\fish-speech-1.5" --decoder-checkpoint-path "checkpoints\fish-speech-1.5\firefly-gan-vq-fsq-8x1024-21hz-generator.pth" --decoder-config-name firefly_gan_vq --half
```

- **별도 터미널**에서 실행해야 합니다 (TTS 생성 스크립트와 다른 터미널).
- `Uvicorn running on http://0.0.0.0:8080` 메시지가 나오면 준비 완료.
- 서버가 이미 켜져 있는지 확인하려면 사용자에게 물어보세요.

## 2. 레퍼런스 음성 관리

### 레퍼런스 파일 위치

```
fish-speech/references/my_voice/
├── my_voice.wav   # 레퍼런스 음성 파일
└── my_voice.lab   # 레퍼런스 텍스트 파일 (음성의 대본)
```

### 레퍼런스 체크 스크립트

사용자가 레퍼런스를 교체했다고 하면, 반드시 아래 스크립트로 체크합니다:

```powershell
& "C:\Users\thisi\miniconda3\envs\fish-speech\python.exe" check_ref.py
```

스크립트 위치: `fish-speech/check_ref.py` (이미 존재함)

#### 체크 기준

| 항목 | 권장값 | 비정상 시 조치 |
|------|--------|----------------|
| 샘플레이트 | 24000 Hz | 리샘플링 필요 |
| 볼륨 | 0.7 ~ 0.9 | 정규화 필요 |
| 채널 | 모노 | 모노 변환 필요 |
| 길이 | 15~30초 권장 | 10초 이상이면 OK |

### 레퍼런스 수정 (리샘플링 + 볼륨 정규화)

체크에서 문제가 발견되면 아래 명령으로 자동 수정:

```powershell
& "C:\Users\thisi\miniconda3\envs\fish-speech\python.exe" -c "import librosa, soundfile as sf, numpy as np; wav=r'c:\Users\thisi\Documents\youtube_generator\fish-speech\references\my_voice\my_voice.wav'; data,_=librosa.load(wav,sr=24000,mono=True); data=data/np.abs(data).max()*0.9; sf.write(wav,data,24000); print('완료!')"
```

수정 후 `check_ref.py`로 재확인합니다.

**중요**: 서버 재시작 불필요. `use_memory_cache` 기본값이 `off`이므로 파일 교체 즉시 반영됩니다.

## 3. TTS 생성

### API 기본 파라미터

```python
{
    "text": "<대본 텍스트>",
    "reference_id": "my_voice",
    "normalize": False,
    "format": "wav",
    "streaming": False,
    "chunk_length": 200,
    "top_p": 0.7,
    "repetition_penalty": 1.2,
    "temperature": 0.7,
}
```

### 단건 TTS 생성 (테스트용)

`fish-speech/test_tts.py`의 `text` 필드만 수정하고 실행:

```powershell
& "C:\Users\thisi\miniconda3\envs\fish-speech\python.exe" test_tts.py
```

### 대량 TTS 생성 (섹션별)

`fish-speech/generate_sections.py` 스크립트를 사용합니다.

#### 사용자 대본 파싱 규칙

1. 타이틀 줄 (예: `- 문제 인식 (S01)`)에서 **섹션ID** 추출 (괄호 안의 값)
2. 타이틀 줄은 TTS 대본에서 **제외**
3. 다음 타이틀이 나오기 전까지의 텍스트를 해당 섹션의 대본으로 사용
4. 줄바꿈은 자연스러운 쉼표나 마침표로 연결

#### 출력 모드

사용자 요청에 따라 3가지 모드 중 하나를 적용합니다:

| 사용자 요청 | 모드 | 출력 파일 |
|-------------|------|----------|
| "원본이랑 배속 둘 다 만들어줘" | `both` | `S01.wav` (원본+정규화) + `S01_1.15x.wav` (배속+정규화) |
| "배속만 만들어줘" 또는 미지정 | `speed_only` (기본) | `S01.wav` (배속+정규화) |
| "원본만 만들어줘" | `original_only` | `S01.wav` (볼륨 정규화만) |

#### 스크립트 구조 (generate_sections.py)

```python
import requests
import subprocess
import os

OUT = r"C:\Users\thisi\Desktop\<폴더명>"  # 사용자와 협의
os.makedirs(OUT, exist_ok=True)

SPEED = 1.15       # 기본값. 사용자가 지정하면 해당 값 사용
MODE = "speed_only" # "both", "speed_only", "original_only"

NORM = "loudnorm=I=-14:TP=-1:LRA=11"
SPEED_NORM = f"atempo={SPEED},{NORM}"

SECTIONS = {
    "S01": "<대본 텍스트>",
    "S02": "<대본 텍스트>",
    # ...
}

for i, (sid, text) in enumerate(SECTIONS.items(), 1):
    print(f"[{i}/{len(SECTIONS)}] {sid} 생성 중...")
    res = requests.post("http://localhost:8080/v1/tts", json={
        "text": text,
        "reference_id": "my_voice",
        "normalize": False,
        "format": "wav",
        "streaming": False,
        "chunk_length": 200,
        "top_p": 0.7,
        "repetition_penalty": 1.2,
        "temperature": 0.7,
    }, timeout=300)

    if res.status_code != 200:
        print(f"  ❌ 실패: {res.text[:100]}")
        continue

    raw = os.path.join(OUT, f"{sid}_raw.wav")
    with open(raw, "wb") as f:
        f.write(res.content)

    if MODE == "both":
        # 원본 (볼륨 정규화만)
        orig = os.path.join(OUT, f"{sid}.wav")
        subprocess.run(["ffmpeg", "-y", "-i", raw, "-filter:a", NORM, orig],
                       capture_output=True, text=True)
        # 배속 (속도 + 볼륨 정규화)
        fast = os.path.join(OUT, f"{sid}_{SPEED}x.wav")
        subprocess.run(["ffmpeg", "-y", "-i", raw, "-filter:a", SPEED_NORM, fast],
                       capture_output=True, text=True)
        os.remove(raw)
        print(f"  ✅ {sid}.wav + {sid}_{SPEED}x.wav 완료")

    elif MODE == "original_only":
        final = os.path.join(OUT, f"{sid}.wav")
        subprocess.run(["ffmpeg", "-y", "-i", raw, "-filter:a", NORM, final],
                       capture_output=True, text=True)
        os.remove(raw)
        print(f"  ✅ {sid}.wav 완료 (볼륨 정규화만)")

    else:  # speed_only (기본)
        final = os.path.join(OUT, f"{sid}.wav")
        subprocess.run(["ffmpeg", "-y", "-i", raw, "-filter:a", SPEED_NORM, final],
                       capture_output=True, text=True)
        os.remove(raw)
        print(f"  ✅ {sid}.wav 완료 ({SPEED}x + 볼륨 정규화)")

print(f"\n전체 완료! 저장 위치: {OUT}")
```

## 4. 후처리 상세

### 속도 조절 (ffmpeg atempo)

- 범위: 0.5 ~ 2.0
- **기본값: 1.15배** (사용자가 지정하지 않은 경우)
- 사용자가 "1.3배로 해줘" 등 말하면 해당 값 적용

### 볼륨 정규화 (ffmpeg loudnorm)

```
loudnorm=I=-14:TP=-1:LRA=11
```

- `I=-14` → YouTube 권장 기준 (-14 LUFS)
- `TP=-1` → 피크 최대 -1dBTP (클리핑 방지)
- `LRA=11` → 라우드니스 레인지

### 통합 필터 명령어

```bash
ffmpeg -y -i input.wav -filter:a "atempo=1.15,loudnorm=I=-14:TP=-1:LRA=11" output.wav
```

## 5. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `ConnectionRefusedError (10061)` | API 서버 안 켜짐 | 섹션 1의 서버 명령어로 시작 |
| `ConnectionResetError (10054)` | 서버 과부하/크래시  | 서버 재시작 후 재시도 |
| TTS 품질 낮음 | 레퍼런스 음성 문제 | `check_ref.py`로 체크 후 수정 |
| 파일 볼륨 들쭉날쭉 | loudnorm 미적용 | ffmpeg 필터에 loudnorm 추가 |
| `--compile` 에러 | Windows 미지원 | `--compile` 옵션 제거 (eager 모드 사용) |

## 6. 실행 체크리스트

사용자가 TTS를 요청하면 아래 순서로 진행:

1. ☐ API 서버 실행 여부 확인 (사용자에게 질문)
2. ☐ 레퍼런스 음성 변경 여부 확인 → 변경 시 `check_ref.py` 실행
3. ☐ 대본에서 섹션ID와 텍스트 파싱
4. ☐ 속도 확인 (사용자 지정값 또는 기본 1.15배)
5. ☐ 출력 모드 확인 (both / speed_only / original_only, 기본: speed_only)
6. ☐ 저장 위치 확인 (기본: 바탕화면)
7. ☐ `generate_sections.py` 작성 및 실행
7. ☐ 완료 보고
