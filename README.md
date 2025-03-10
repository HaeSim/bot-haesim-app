# Bot Haesim App (해심 봇 애플리케이션)

## 프로젝트 개요

해심 봇 애플리케이션은 Webex 메시징 플랫폼에서 작동하는 대화형 봇 서비스입니다. 이 봇은 다양한 명령어를 처리하고 메시지를 저장하는 기능을 제공합니다.

## 기술 스택

- **백엔드**: NestJS (Node.js 프레임워크)
- **데이터베이스**: Oracle Cloud Database
- **API 통합**: Webex Bot Framework
- **의존성 관리**: npm/yarn

## 아키텍처 구조

이 애플리케이션은 모듈화된 NestJS 아키텍처를 기반으로 설계되었습니다.

### 핵심 모듈

#### 1. App 모듈 (`app.module.ts`)

- 애플리케이션의 루트 모듈로 모든 하위 모듈을 통합합니다.
- 서비스 구성 및 종속성 주입을 관리합니다.

#### 2. Config 모듈 (`config.module.ts`, `config.service.ts`)

- 환경 변수 및 구성 설정을 관리합니다.
- NestJS의 ConfigService를 래핑하여 간단한 구성 액세스를 제공합니다.

#### 3. Database 모듈 (`database.module.ts`)

- TypeORM을 사용하여 Oracle 데이터베이스 연결을 관리합니다.
- TLS를 통한 안전한 데이터베이스 연결을 설정합니다.

#### 4. Messages 모듈 (`messages.module.ts`, `messages.service.ts`)

- 메시지 생성, 조회 및 관리 기능을 제공합니다.
- `Message` 엔티티를 사용하여 메시지 데이터를 저장합니다.

#### 5. Webex 모듈 (`webex.module.ts`)

- Webex API 통합을 관리합니다.
- 아래 두 개의 하위 모듈을 포함합니다:
  - **Bot 모듈** (`bot.module.ts`, `bot.service.ts`, `bot.controller.ts`): Webex 봇 프레임워크 연동 및 메시지 처리
  - **Commands 모듈** (`commands.module.ts`, `commands.service.ts`): 봇 명령어 정의 및 처리

#### 6. Health 모듈 (`health.module.ts`, `health.controller.ts`)

- 애플리케이션 상태 모니터링을 위한 헬스 체크 엔드포인트를 제공합니다.

### 공통 컴포넌트 (`common/`)

- **Constants**: 애플리케이션 상수 정의
- **Decorators**: 사용자 정의 데코레이터
- **Filters**: 예외 처리를 위한 HTTP 예외 필터
- **Guards**: 인증 및 권한 가드
- **Interceptors**: 로깅 및 요청/응답 변환을 위한 인터셉터
- **Middleware**: 로깅 미들웨어
- **Utils**: 날짜 유틸리티 등 공통 기능

## 주요 기능

### 1. Webex 봇 통합

- Webex API를 통한 메시지 수신 및 발신
- 웹훅을 통한 실시간 이벤트 처리

### 2. 명령어 처리 시스템

- 패턴 매칭을 통한 명령어 인식 및 실행
- 우선순위 기반 명령어 처리

### 3. 기본 제공 명령어

- `/도움말`, `/help`: 사용 가능한 명령어 목록 표시
- `/에코`, `/echo`: 입력한 텍스트 반복
- 인사 명령어 (`안녕`, `hello`, `hi`)
- `/히스토리`, `/history`: 대화방 메시지 기록 표시
- `/저장`, `/save`: 메시지 데이터베이스 저장

### 4. 데이터베이스 통합

- 메시지 영구 저장 및 조회
- Oracle Cloud Database 연동

## 파일 구조

```shell
src/
 ┣ common/                 # 공통 유틸리티 및 헬퍼
 ┃ ┣ constants/           # 상수 정의
 ┃ ┣ decorators/          # 사용자 정의 데코레이터
 ┃ ┣ filters/             # 예외 필터
 ┃ ┣ guards/              # 인증 가드
 ┃ ┣ interceptors/        # 로깅 인터셉터
 ┃ ┣ middleware/          # 미들웨어
 ┃ ┗ utils/               # 유틸리티 함수
 ┣ config/                # 환경 설정
 ┣ database/              # 데이터베이스 연결 설정
 ┣ health/                # 헬스 체크 엔드포인트
 ┣ messages/              # 메시지 관리
 ┃ ┣ dto/                 # 데이터 전송 객체
 ┃ ┗ entities/            # 데이터베이스 엔티티
 ┣ webex/                 # Webex 통합
 ┃ ┣ bot/                 # 봇 서비스
 ┃ ┣ commands/            # 명령어 처리
 ┃ ┗ interfaces/          # 타입 정의
 ┣ app.module.ts          # 루트 모듈
 ┗ main.ts                # 애플리케이션 진입점
```

## 데이터 모델

### Message 엔티티

- **ID**: 기본 키
- **TEXT**: 메시지 내용
- **userId**: 사용자 식별자
- **roomId**: 메시지가 발생한 대화방 ID
- **createdAt**: 생성 타임스탬프

## 설치 및 실행

### 1. 의존성 설치

```shell
npm install
```

### 2. 환경 변수 설정

```shell
# .env 파일 생성
BOT_ACCESS_TOKEN=your_webex_bot_token
DOMAIN_NAME=your_app_domain
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
```

### 3. 애플리케이션 실행

```shell
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run start:prod
```

## 배포

이 애플리케이션은 Docker를 사용하여 컨테이너화하여 배포할 수 있습니다. 자세한 배포 지침은 별도 문서를 참조하세요.
