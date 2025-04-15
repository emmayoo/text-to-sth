# Text to Multi-Media Generator

텍스트를 다양한 멀티미디어 형식으로 변환하는 Next.js 기반 웹 애플리케이션입니다.

## 주요 기능

- **Text to Speech**: Google Cloud Text-to-Speech API를 사용하여 자연스러운 음성을 생성
  - 다양한 음성 설정 지원 (언어, 음색 등)
  - MP3 형식으로 출력
- **Text to Image**: OpenAI DALL·E 2를 활용한 고품질 이미지 생성
  - 1024x1024 해상도
  - 추가 프롬프트를 통한 이미지 스타일 커스터마이징
- **Text to Video**: D-ID API를 통한 AI 아바타 비디오 생성
  - 실제 사람과 같은 자연스러운 아바타가 텍스트를 말하는 비디오 생성
  - 다양한 아바타 선택 가능
  - 자연스러운 립싱크와 표정 변화
- **Text to Video**: Runway AI Gen-2 모델을 통한 AI 비디오 생성
  - 텍스트 프롬프트 기반의 고품질 비디오 생성
  - 4초 길이의 HD 비디오 생성
  - 자연스러운 움직임과 장면 전환
- **다국어 지원**: Google Cloud Translate API를 통한 자동 번역 기능
  - 입력된 한국어를 영어로 자동 번역하여 AI 모델에 전달

## 사용 기술

- **Frontend**: Next.js, TypeScript
- **AI Services**:
  - Google Cloud Text-to-Speech
  - OpenAI DALL·E 2
  - Runway AI Gen-2
  - Google Cloud Translate

## 환경 설정

프로젝트 실행을 위해 다음 API 키들이 필요합니다:

1. **Google Cloud 설정**

   - `GOOGLE_CREDENTIALS_BASE64`: Google Cloud 서비스 계정 키 (Base64 인코딩)
   - 필요한 API 활성화: Cloud Text-to-Speech, Cloud Translate

2. **OpenAI 설정**

   - `OPENAI_API_KEY`: OpenAI API 키
   - DALL·E API 사용 권한 필요

3. **Runway AI 설정**
   - `RUNWAY_API_KEY`: Runway AI API 키
   - 최소 50 크레딧 필요

### 환경 변수 설정

`.env.local` 파일에 다음과 같이 설정:

```env
# Google Cloud
GOOGLE_CREDENTIALS_BASE64=your_base64_encoded_credentials

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Runway AI
RUNWAY_API_KEY=your_runway_api_key
```

## 사용 방법

1. 환경 변수 설정
2. 의존성 설치: `npm install`
3. 개발 서버 실행: `npm run dev`
4. http://localhost:3000 접속
