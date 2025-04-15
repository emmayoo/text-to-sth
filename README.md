# Text to Multi-Media Generator

텍스트를 다양한 멀티미디어 형식으로 변환하고 AWS S3에 저장하는 Next.js 기반 웹 애플리케이션입니다.

## 주요 기능

- **Text to Speech**: Google Cloud Text-to-Speech API를 사용하여 자연스러운 음성을 생성
  - 9가지 한국어 음성 설정 지원 (Neural2, Standard, Wavenet)
  - MP3 형식으로 출력
  - 실시간 음성 미리듣기 지원
- **Text to Image**: OpenAI DALL·E 2를 활용한 고품질 이미지 생성
  - 1024x1024 해상도
  - 추가 프롬프트를 통한 이미지 스타일 커스터마이징
  - 자동 프롬프트 생성 기능
- **Text to Video**: Runway Gen-2 모델을 통한 AI 비디오 생성
  - 이미지 기반 비디오 생성
  - 텍스트 프롬프트와 함께 이미지 업로드 또는 URL 입력 지원
  - 4초 길이의 HD 비디오 생성
- **번역 기능 지원**: Google Cloud Translate API를 통한 자동 번역 기능 (한국어 -> 영어)
- **저장 기능**: AWS S3를 통한 미디어 파일 영구 저장
  - 생성된 음성, 이미지, 비디오 중 선택적 저장
  - 외부 URL로 생성된 파일도 자동 다운로드 후 S3 저장
  - 저장 이력 JSON 파일 자동 생성

## 사용 기술

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Storage**: AWS S3
- **AI Services**:
  - Google Cloud Text-to-Speech
  - OpenAI DALL·E 2
  - Runway Gen-2
  - Google Cloud Translate

## 환경 설정

프로젝트 실행을 위해 다음 API 키들이 필요합니다:

1. **Google Cloud 설정**

   - `GOOGLE_CREDENTIALS_BASE64`: Google Cloud 서비스 계정 키 (Base64 인코딩)
   - `GOOGLE_API_KEY`: Google Cloud API 키
   - 필요한 API 활성화: Cloud Text-to-Speech, Cloud Translate

2. **OpenAI 설정**

   - `OPENAI_API_KEY`: OpenAI API 키
   - DALL·E API 사용 권한 필요

3. **AWS S3 설정**
   - `AWS_ACCESS_KEY_ID`: AWS IAM 사용자의 액세스 키 ID
   - `AWS_SECRET_ACCESS_KEY`: AWS IAM 사용자의 시크릿 액세스 키
   - `AWS_REGION`: S3 버킷이 위치한 리전 (예: ap-northeast-2)
   - `AWS_S3_BUCKET`: 사용할 S3 버킷 이름

### 환경 변수 설정

`.env` 파일에 다음과 같이 설정:

```env
# Google Cloud
GOOGLE_CREDENTIALS_BASE64=your_base64_encoded_credentials
GOOGLE_API_KEY=your_google_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=your_bucket_name
```

## 사용 방법

1. 환경 변수 설정
2. 의존성 설치: `npm install`
3. 개발 서버 실행: `npm run dev`
4. http://localhost:3000 접속

### 미디어 생성 및 저장 과정

1. 변환할 텍스트 입력
2. '생성하기' 버튼 클릭
   - 음성과 이미지가 자동으로 생성됨
   - 생성된 이미지를 기반으로 비디오 생성 가능
3. 저장하고 싶은 항목 선택
4. '선택항목 저장' 버튼 클릭
   - 선택된 항목들이 S3에 자동 업로드됨
   - 저장 정보가 JSON 파일로 기록됨
