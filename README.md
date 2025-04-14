# Text to Multi-Media Generator

텍스트를 다양한 멀티미디어 형식으로 변환하는 Next.js 기반 웹 애플리케이션입니다.

## 주요 기능

- **Text to Speech**: Google Cloud Text-to-Speech API를 사용하여 자연스러운 음성을 생성
- **Text to Image**: Stable Diffusion XL (Hugging Face)을 활용한 고품질 이미지 생성
- **Text to Video**: D-ID API를 통한 AI 아바타 영상 생성
- 다국어 지원: Google Cloud Translate API를 통한 자동 번역 기능

## 사용 기술

- **Frontend**: Next.js, TypeScript
- **AI Services**:
  - Google Cloud Text-to-Speech
  - Hugging Face Stable Diffusion XL
  - D-ID API
  - Google Cloud Translate

## 환경 설정

프로젝트 실행을 위해 다음 API 키들이 필요합니다:

- Google Cloud API 키 (Text-to-Speech, Translate)
- Hugging Face API 키 (Stable Diffusion)
- D-ID API 키 (Video Generation)

API 키는 환경 변수로 설정해야 합니다.
