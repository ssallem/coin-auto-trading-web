# Team Decisions Log

## 프로젝트
- 경로: D:/dev/CoinAutoTrading-Web
- 유형: Next.js (TypeScript) + Vercel 배포
- 관련 프로젝트: D:/dev/CoinAutoTrading (Python Upbit 자동매매 봇)
- 규칙: 없음 (신규 프로젝트)

## 미션
- 원본 요청: "trading 작업이 쉽게 웹이나 모바일에서 제어 가능하도록 vercel로 만들어줘. 소스도 github.com/ssallem으로 정리해주고"
- 시작 시각: 2026-02-22
- 핵심 목표:
  1. Upbit 코인 자동매매를 웹/모바일에서 모니터링 및 제어하는 대시보드
  2. Next.js 서버리스 함수가 Upbit API 직접 호출 (별도 백엔드 불필요)
  3. Vercel 배포
  4. GitHub 저장소 2개 분리: ssallem/coin-auto-trading (Python) + ssallem/coin-auto-trading-web (Next.js)

## 작업 분석
- 작업 유형: 신규 개발 + 인프라/배포
- 복잡도: 복잡
- 기술 스택: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Vercel
- 아키텍처: Vercel 서버리스 함수 → Upbit API 직접 연동
- 탐색 결과 (Phase 2):
  - Upbit API: JWT 인증 (HS256, access_key + nonce + query_hash SHA512), Rate Limit (Exchange 30/s, Order 8/s, Quotation 10/s)
  - 주문 API: 시장가매수=ord_type:price+price파라미터, 시장가매도=ord_type:market+volume파라미터, 최소 5000KRW
  - 차트: lightweight-charts v5 (캔들) + Recharts (포트폴리오), SSR 비활성 필수
  - UI: shadcn/ui + Tailwind CSS v4
  - 상태관리: TanStack Query v5 (서버데이터) + Zustand v5 (UI상태)
  - 실시간: 클라이언트 WebSocket(wss://api.upbit.com/websocket/v1) + TanStack Query polling 폴백
  - Vercel 제한: Hobby 10s timeout, Edge Runtime 시세조회, Node.js Runtime 주문
  - API키: NEXT_PUBLIC_ 절대 금지, Route Handler에서만 접근
  - CORS: 서버리스 프록시이므로 이슈 없음
- 팀 구성:
  - 탐색가 2명 (병렬): Upbit API 웹 연동 조사 + Next.js/Vercel 베스트 프랙티스 조사
  - 설계자 1명: 웹 대시보드 아키텍처 설계
  - 개발자 3~5명: 구현 (라운드별 병렬)
  - 검토자 1명: 비판적 검토
- 핵심 기능:
  - 실시간 포트폴리오 현황 (잔고, 보유 코인, 평가손익)
  - 시세 차트 (캔들 + 지표)
  - 수동 매수/매도 주문
  - 자동매매 설정 (전략 선택, 파라미터 조정)
  - 거래 내역 조회
  - 모바일 반응형 UI

## 설계 결정
- 아키텍처: Next.js 15 App Router, Vercel 서버리스 → Upbit API 직접 프록시. Python 봇과 완전 분리 독립 웹앱
- 인증: PIN 기반 (bcrypt 해시), jose JWT 세션쿠키 (HttpOnly, 7일), middleware.ts에서 보호
- 시세 API: Edge Runtime (ticker, candles, orderbook, markets) - 인증 불필요
- 계좌/주문 API: Node.js Runtime (JWT 인증 필요) - accounts, orders, strategy
- 실시간: 클라이언트 WebSocket(wss://api.upbit.com/websocket/v1) → queryClient.setQueryData() 캐시 업데이트
- 전략 설정 저장: Vercel KV (@vercel/kv)
- UI: shadcn/ui + Tailwind CSS v4, 모바일 반응형 (사이드바→하단탭)
- 차트: lightweight-charts v5 (dynamic import, ssr:false) + Recharts (포트폴리오 통계)
- 상태: TanStack Query v5 (서버데이터) + Zustand v5 (UI상태)
- 폼: react-hook-form + zod
- 알림: sonner 토스트
- 한국 코인 관례: 상승=빨강(#ef4444), 하락=파랑(#3b82f6)
- 페이지: /login, /portfolio, /chart/[market], /trade, /strategy, /history, /settings
- 환경변수: UPBIT_ACCESS_KEY, UPBIT_SECRET_KEY (서버전용), DASHBOARD_PIN_HASH, SESSION_SECRET, KV_*
- 구현 라운드:
  - R1: 프로젝트 초기화 + 타입/유틸 (병렬 2팀)
  - R2: 인증 + API Routes (병렬 2팀)
  - R3: 레이아웃 + 공통컴포넌트/훅 (병렬 2팀)
  - R4: 포트폴리오 + 차트 + 거래/전략 페이지 (병렬 3팀)
  - R5: GitHub 연동 + Vercel 배포

## 완료된 작업
- R1-A: 프로젝트 초기화 완료 (Next.js 16.1.6, TypeScript, Tailwind v4, shadcn/ui 16개 컴포넌트)
  - 모든 npm 의존성 설치 완료 (react-query, zustand, jose, zod, lightweight-charts, recharts 등)
  - 빌드 성공 확인
  - 폴더 구조 생성 (App Router 라우트 그룹, API Routes, components, hooks, lib, stores, types)

## 변경된 파일
- R1-A 생성/수정:
  - src/app/layout.tsx (lang="ko", Providers, Toaster)
  - src/components/providers.tsx (QueryClientProvider + ReactQueryDevtools)
  - .env.example (환경변수 템플릿)
  - src/components/ui/* (shadcn 16개 컴포넌트)
  - 폴더 구조 (.gitkeep)
- R1-B: 타입 정의 + 유틸리티 완료 (7개 파일)
  - src/types/upbit.ts (Upbit API 응답 타입 10개 + CandleInterval)
  - src/types/trading.ts (도메인 타입 7개: Holding, StrategyConfig, RiskConfig, TradingConfig, PortfolioSummary 등)
  - src/lib/upbit-jwt.ts (generateUpbitJWT, generateUpbitJWTWithQuery, fetchUpbitAPI)
  - src/lib/session.ts (createSession, verifySession, getSession, getSessionCookieOptions)
  - src/lib/query-keys.ts (queryKeys 팩토리, QUERY_CONFIG)
  - src/lib/validations/order.schema.ts (OrderSchema: zod 주문 검증)
  - src/lib/validations/strategy.schema.ts (StrategyConfigSchema, RiskConfigSchema)
  - 빌드 + tsc 타입체크 통과
- R2-A: 인증 시스템 완료 (5개 파일)
  - src/middleware.ts (Edge Runtime JWT 검증, 라우트 보호)
  - src/app/api/auth/login/route.ts (PIN bcrypt 검증 → 세션 쿠키)
  - src/app/api/auth/logout/route.ts (쿠키 삭제)
  - src/app/(auth)/login/page.tsx (서버 컴포넌트 셸)
  - src/components/auth/login-form.tsx (PIN 입력 폼, shadcn Card/Input/Button)
- R2-B: API Routes 완료 (8개 파일)
  - Edge Runtime (인증불필요): ticker, candles, orderbook, markets
  - Node.js Runtime (JWT인증): accounts, orders, orders/[uuid], strategy/config
  - 전략 설정은 .strategy-config.json 파일 저장 (초기 버전)
  - 빌드 성공
- R3-A: 레이아웃 + 스토어 완료 (6개 파일)
  - src/app/(dashboard)/layout.tsx (사이드바+헤더+메인 구조)
  - src/components/layout/sidebar.tsx (6개 네비, 접힘모드, 로그아웃)
  - src/components/layout/header.tsx (모바일 Sheet, WS 상태, 페이지 타이틀)
  - src/stores/ui-store.ts (사이드바, 차트설정, 주문폼, WS 상태)
  - src/stores/strategy-store.ts (전략설정 임시상태)
  - src/app/(dashboard)/page.tsx (/portfolio 리다이렉트)
- R3-B: 공통 컴포넌트 + 훅 완료 (9개 파일)
  - 컴포넌트: price-display, pnl-badge, confirm-dialog, loading-skeleton
  - 훅: use-accounts, use-ticker, use-candles, use-orders(+mutation), use-upbit-websocket
  - 빌드 성공
- R4-A: 포트폴리오 페이지 완료 (5개 파일)
  - portfolio/page.tsx, portfolio-content.tsx (데이터 허브, WebSocket 실시간)
  - portfolio-summary.tsx (4개 카드: 총자산, KRW, 투자금, 손익)
  - holding-list.tsx (보유코인 테이블, 반응형)
  - portfolio-donut.tsx (Recharts 도넛, 자산배분)
- R4-B: 차트 페이지 완료 (5개 파일)
  - chart/[market]/page.tsx, chart-content.tsx (반응형 레이아웃)
  - candle-chart.tsx (lightweight-charts v5, dynamic import, 상승빨강/하락파랑)
  - chart-toolbar.tsx (마켓 Select + 인터벌 버튼)
  - orderbook-panel.tsx (호가 10단계, 바차트 시각화)
- R4-C: 거래/전략/내역 페이지 완료 (7개 파일)
  - trade/page.tsx, trade-content.tsx, order-form.tsx (react-hook-form+zod, 시장가/지정가)
  - open-order-list.tsx (미체결 주문 + 취소)
  - strategy/page.tsx, strategy-content.tsx (RSI/MA/Bollinger 파라미터, 리스크 설정)
  - history/page.tsx (체결 내역 테이블, 모바일 카드)
  - shadcn checkbox, switch 추가 설치
  - 빌드 성공

## 발견된 이슈
- Phase 5 검토 결과: CRITICAL 6건, WARNING 10건, SUGGESTION 7건
- C-01: strategy/config - 하드코딩 절대경로 D:/ → Vercel 배포 불가
- C-02: middleware.ts - /api/auth/logout 공개 경로 노출 (CSRF 가능성)
- C-03: auth/login - 환경변수 이름 클라이언트 노출
- C-04: ticker/orderbook - markets 파라미터 인젝션 미검증
- C-05: candle-chart.tsx - KST→UTC 타임스탬프 9시간 오차
- C-06: upbit-jwt.ts - POST body undefined 직렬화 오류
- W-03: portfolio-content - balance+locked 불일치
- W-04: history - 시장가 체결금액 0 표시
- W-05: query-keys - ticker/orderbook polling Rate Limit 초과 가능
- W-06: order-form - 확인 다이얼로그 stale 값 사용
- W-07: strategy-content - risk 설정 미전송
- W-09: session.ts - secure:true 로컬개발 불가

## R5 완료: GitHub + Vercel 배포
- GitHub push 완료:
  - Python 봇: https://github.com/ssallem/coin-auto-trading (28 files, 5,791 lines)
  - 웹 대시보드: https://github.com/ssallem/coin-auto-trading-web (117 files, 21,280 lines)
- Vercel 배포 완료:
  - 프로덕션 URL: https://coin-auto-trading-web.vercel.app
  - 대시보드: https://vercel.com/ssallems-projects/coin-auto-trading-web
  - 빌드: Next.js 16.1.6 (Turbopack), 46초, 정적 7페이지 + 동적 API 10개
- 환경변수 4개 설정 완료 + 재배포 완료 (2026-02-22)
  - DASHBOARD_PIN_HASH (PIN: 2000)
  - SESSION_SECRET (자동생성 랜덤 키)
  - UPBIT_ACCESS_KEY
  - UPBIT_SECRET_KEY

## 남은 작업
- ~~Vercel 환경변수 4개 설정~~ (완료)
- 설정 페이지(/settings) 구현 (API 키 입력 UI 등)
- Vercel KV로 전략 설정 저장 전환 (현재 파일 기반)
- E2E 테스트 (로그인→포트폴리오→차트→주문→설정)
- 다크/라이트 모드 토글 UI
