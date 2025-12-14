# jaTerm - Web-based SSH Terminal Service

안전한 웹 기반 SSH 터미널 서비스로, 서버 접근 제어, 세션 녹화, AI 기반 보안 분석 기능을 제공합니다.

## 주요 기능

- **웹 터미널**: xterm.js 기반 웹 터미널 인터페이스
- **인증/인가**: 역할 기반 접근 제어(RBAC), MFA 지원
- **접근 정책**: 시간 기반, 역할 기반 서버 접근 정책
- **명령 제어**: 위험 명령 차단 (블랙리스트/화이트리스트)
- **세션 녹화**: 모든 터미널 세션 녹화 및 재생
- **AI 보안**: 위험 명령 분석, 이상 행위 탐지
- **감사 로그**: 모든 활동 기록 및 검색

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일이 이미 생성되어 있습니다. 필요시 수정하세요.

### 3. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 마이그레이션
npm run db:push

# (선택) 샘플 데이터 생성
npx tsx prisma/seed.ts
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 앱을 확인할 수 있습니다.

## 데모 계정

| 역할      | 이메일              | 비밀번호    | MFA             |
| --------- | ------------------- | ----------- | --------------- |
| Admin     | admin@jaterm.com    | admin123    | 6자리 아무 코드 |
| Operator  | operator@jaterm.com | operator123 | 없음            |
| Developer | dev@jaterm.com      | dev123      | 없음            |

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── admin/             # 관리자 대시보드
│   ├── api/               # API 라우트
│   ├── login/             # 로그인 페이지
│   └── terminal/          # 터미널 페이지
├── components/            # React 컴포넌트
│   └── terminal/          # 터미널 관련 컴포넌트
└── lib/                   # 핵심 라이브러리
    ├── auth/              # 인증 (NextAuth, MFA, 세션)
    ├── ssh/               # SSH 프록시, 명령 필터
    ├── policy/            # 정책 엔진, 승인 워크플로
    ├── audit/             # 감사 로그, 세션 녹화
    └── ai/                # 명령 분석, 이상 탐지
```

## 아키텍처

```
Browser (xterm.js) → Auth Gateway → SSH Proxy → Policy Engine → Target Server
                                       ↓
                                 Audit Log + AI Analyzer
```

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Terminal**: xterm.js
- **Database**: SQLite (개발) / PostgreSQL (프로덕션)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Styling**: CSS Variables, Modern Dark Theme

## 보안 기능

### 명령 차단 (기본 블랙리스트)

- `rm -rf /`
- `mkfs`
- `dd if=/dev/zero`
- `shutdown`, `reboot`
- `chmod 777 /`

### AI 분석

- 명령 위험도 점수화 (0.0 ~ 1.0)
- 사용자 행동 패턴 분석
- 이상 행위 실시간 알림

## 라이선스

MIT License
