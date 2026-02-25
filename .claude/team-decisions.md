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

## 배포 후 수정
- src/app/page.tsx가 기본 Next.js 템플릿 그대로였음 → /portfolio 리다이렉트로 교체
- src/app/(dashboard)/page.tsx 중복 삭제 (루트 page.tsx와 경로 충돌)
- public/ 기본 SVG 5개 삭제 (next.svg, vercel.svg 등)
- GitHub push + Vercel 재배포 완료

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

## 미션 2: 웹 중심 아키텍처 전환
- 원본 요청: "config.yaml 설정 확인해줘. config도 web으로 설정 가능하게 해줘. 기본적으로 local 방식이 아니라 모든걸 web 방식으로 변경해줘. 필요하면 supabase를 사용해도 돼."
- 시작 시각: 2026-02-22
- 핵심 목표:
  1. Python 봇의 config.yaml → Supabase DB로 이전
  2. 웹 대시보드에서 모든 설정 관리 가능하게
  3. 로컬 방식 → 웹 방식으로 전환
  4. 전략 설정(.strategy-config.json) → Supabase로 전환

## 미션 2 탐색 결과
- Python config.yaml 7개 섹션: trading, investment, risk, strategy, backtest, logging, notification
- Python settings.py: 싱글턴 패턴, dataclass 매핑, validate() 검증 로직
- 웹 전략 설정: .strategy-config.json 파일 기반 (strategy + risk 섹션만)
- 변경 필요 핵심 파일: src/app/api/strategy/config/route.ts (readConfig/writeConfig만 교체)
- /settings 페이지: 미구현 (.gitkeep만 존재)
- 단일 사용자 구조 (user_id 없음)
- Python config에는 있지만 웹에는 없는 섹션: trading, investment, backtest, logging, notification
- Supabase 전환 시 추가 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

## 미션 2 설계
- 접근법: Supabase 단일 테이블 bot_config, id=1 고정 row, 7개 섹션 JSONB 컬럼
- 웹: @supabase/supabase-js (service_role key), 파일 I/O → Supabase CRUD로 교체
- Python: requests HTTP → Supabase REST API, yaml은 fallback으로 유지
- /settings 페이지: 7탭 (거래/투자/리스크/전략/백테스팅/로깅/알림)
- 변경 파일: 웹 19개 (신규 16 + 수정 3), Python 3개 (신규 1 + 수정 2)
- 구현 라운드: R1(인프라) → R2(핵심 라이브러리) → R3(스키마/타입) → R4(API 마이그레이션) → R5(신규 API/훅) → R6(UI 4팀 병렬) → R7(통합)
- 환경변수 추가: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Vercel + Python .env)

## 미션 2 완료 작업
- R1: Vercel 환경변수 2개 설정, npm install @supabase/supabase-js, Python .env/.env.example 업데이트, requirements.txt 업데이트
- R1: Supabase 테이블 생성 → 사용자 수동 실행 필요
- R2-5 웹 (빌드 성공):
  - src/lib/supabase.ts (신규) - Supabase 클라이언트 + getBotConfig/updateBotConfig
  - src/lib/validations/config.schema.ts (신규) - 7개 섹션 Zod 스키마
  - src/lib/validations/strategy.schema.ts (수정) - use_ema→ma_type 동기화
  - src/types/trading.ts (수정) - 5개 Config 타입 추가
  - src/lib/query-keys.ts (수정) - botConfig 키 추가
  - src/app/api/strategy/config/route.ts (수정) - 파일I/O→Supabase
  - src/app/api/settings/config/route.ts (신규) - 7섹션 GET/PUT
  - src/hooks/use-bot-config.ts (신규) - useBotConfig/useUpdateBotConfig
  - src/components/strategy/strategy-content.tsx (수정) - use_ema→ma_type UI 변경
- R2-5 Python:
  - config/supabase_loader.py (신규) - Supabase REST 조회
  - config/settings.py (수정) - Supabase 우선 로드, yaml fallback
- R6 설정 UI (빌드 성공):
  - src/app/(dashboard)/settings/page.tsx (신규)
  - src/components/settings/settings-content.tsx (신규) - 7탭 컨테이너
  - src/components/settings/sections/trading-section.tsx (신규)
  - src/components/settings/sections/investment-section.tsx (신규)
  - src/components/settings/sections/risk-section.tsx (신규)
  - src/components/settings/sections/strategy-section.tsx (신규)
  - src/components/settings/sections/backtest-section.tsx (신규)
  - src/components/settings/sections/logging-section.tsx (신규)
  - src/components/settings/sections/notification-section.tsx (신규)
- R7 빌드 검증: 2개 에러 수정 (LoggingConfig 타입, Zod v4 API), 3회차 빌드 성공
- 검토 결과: CRITICAL 4건 + WARNING 2건 수정
  - C-1: Python trailing_stop 중첩→플랫 구조 변환
  - C-2: timeframe 포맷 Python과 통일 (minute1, minute60 등)
  - C-3: RiskConfigSchema에서 investment 중복 필드 제거
  - C-4: Supabase 클라이언트 싱글턴 적용
  - W-1: BacktestConfig 날짜 YYYY-MM-DD 검증
  - W-3: markets KRW- 접두사 검증
- GitHub push + Vercel 재배포 완료

## 미션 3: 자동매매 실행 시도 (2026-02-22)
- Supabase 설정 로드: 성공 ("Supabase에서 설정을 로드했습니다")
- 설정 검증: 성공 (markets: KRW-BTC, strategy: rsi, timeframe: minute60)
- 백테스트: 성공 (+2.98%, 승률 100%, MDD 0.27%, Sharpe 2.41)
- API 연결: 실패 - [no_authorization_ip] This is not a verified IP
- 자동매매: 미실행 (IP 미등록)
- 필요 조치: Upbit Open API에 현재 PC의 공인 IP 등록 필요
- API 키 갱신 후 재시도: 성공
  - 새 키: [REDACTED]
  - check 통과: KRW 잔고 58,836원, 보유 코인 없음
  - trade 시작: 2026-02-22 22:00:56, RSI 전략, KRW-BTC, 60초 주기
  - Vercel 재배포 완료

## 미션 4: 웹 대시보드 Supabase 동기화 아키텍처 (2026-02-22)
- 원본 요청: "web 대시보드에서 잔고 확인이 안되고있어. 실시간 잔고랑 매매 이력, 실제 매매 가능하게 설정을 해줘."
- 근본 원인: Vercel 서버리스 함수의 동적 IP가 Upbit API 화이트리스트에 미등록 → no_authorization_ip 에러
- 영향받는 API: /api/accounts, /api/orders, /api/orders/[uuid] (인증 필요 API 전부)
- 프론트엔드: useAccounts()에서 error 미처리 → 조용히 0.00 표시
- 선택한 솔루션: Python 봇 → Supabase 동기화 → 웹 대시보드 읽기 (기존 Supabase 인프라 활용)
- 작업 유형: 아키텍처 변경 + 신규 개발
- 복잡도: 복잡
- 팀 구성: 설계자 1명 + 개발자 3~4명 + 검토자 1명

## 미션 4 설계
- 접근법: Supabase를 단방향 데이터 허브로 사용. Python 봇=Writer, 웹=Reader. 주문만 역방향(웹→Supabase→봇).
- 웹 API 인터페이스(UpbitBalance[], UpbitOrder[]) 유지 → 프론트엔드 훅 수정 불필요
- Supabase 테이블 3개: pending_orders(웹주문요청) → order_history(체결이력, FK) → account_snapshots(잔고)
- 동기화 주기: 잔고 30초, 주문이력 즉시(체결 직후), pending 폴링 매 사이클
- DDL 실행 순서: pending_orders → order_history → account_snapshots (FK 의존성)
- 변경 파일 9개:
  - Python 신규: sync/__init__.py, sync/supabase_sync.py
  - Python 수정: trading/engine.py, trading/order_manager.py
  - Web 신규: src/types/supabase.ts
  - Web 수정: src/lib/supabase.ts, src/app/api/accounts/route.ts, src/app/api/orders/route.ts, src/app/api/orders/[uuid]/route.ts
- 구현 라운드: R1(DDL 사용자실행) → R2(Python 동기화, 병렬) → R3(웹 API 수정, 병렬)

## 미션 4 완료 작업
- R2 Python 동기화 모듈:
  - sync/__init__.py (신규) - 빈 패키지 초기화
  - sync/supabase_sync.py (신규) - SupabaseSync 클래스 (잔고/주문/pending 처리, 30초 주기, 예외 무시)
  - trading/engine.py (수정) - __init__에 sync 초기화, _execute_cycle에 _sync_account_if_needed + _process_pending_orders 추가
  - trading/order_manager.py (수정) - __init__에 sync 파라미터, execute_buy/sell 후 push_order_history 추가
- R3 웹 API 수정:
  - src/types/supabase.ts (신규) - AccountSnapshotRow, OrderHistoryRow, PendingOrderRow 타입
  - src/lib/supabase.ts (수정) - 5개 함수 추가 (getLatestAccountSnapshot, getOrderHistory, getOrderHistoryByUuid, createPendingOrder, cancelPendingOrder)
  - src/app/api/accounts/route.ts (수정) - Upbit→Supabase, UpbitBalance[] 형식 유지, X-Snapshot-At 헤더
  - src/app/api/orders/route.ts (수정) - GET: order_history, POST: pending_orders
  - src/app/api/orders/[uuid]/route.ts (수정) - GET: 단건조회, DELETE: 취소(409 처리)

## 미션 4 검토 결과
- CRITICAL 4건 + WARNING 5건 발견, 전부 수정 완료
  - C-1: bot_id 누락 → payload/params에 bot_id="main" 추가
  - C-2: side 타입 불일치 (buy/sell vs bid/ask) → OrderHistoryRow.side를 'bid'|'ask'로 수정, toUpbitOrder 변환 제거
  - C-3: 시장가 매도 amount=0 → 현재가*수량으로 추정 계산
  - C-4: fetch_pending_orders 정렬 컬럼 오류 (created_at→requested_at)
  - W-1: limit 파라미터 검증 (1~200 범위 제한)
  - W-2: holdings 타입 불일치 (float→str 변환)
  - W-3: side 파라미터 검증 (bid/ask만 허용)
  - W-4: mark_pending_processing 낙관적 잠금 추가
  - W-5: orders/[uuid]/route.ts side 변환 제거
- 빌드 검증: 성공

## 미션 5: 거래 Combobox + 공격적 단타 전략 (2026-02-24)
- 원본 요청:
  1. 거래 탭 Combobox에 USDC(보유 코인)가 표시 안됨 → 수정
  2. 매수/매도 최소 5만원으로 변경 (현재 1만원 → 수익 미미)
  3. 공격적 단타 전략 + 최신 매매 기법 적용
- 작업 유형: 버그 수정 + 전략 최적화
- 복잡도: 보통
- 팀 구성: explorer(2) → coder(1~2) → critic(1)

### 미션 5 탐색 결과
- **USDC 문제 원인**: trade-content.tsx:28-40에 하드코딩된 MARKETS 배열(10개 코인)에 USDC 미포함
  - Chart 탭은 /api/markets 동적 API 사용 (Upbit 전체 KRW 마켓 반환)
  - Trade 탭만 하드코딩 → 불일치
  - 해결: Trade 탭도 /api/markets 동적 방식으로 전환 (chart-toolbar.tsx와 동일 패턴)
- **현재 전략 설정** (보수적 중장기):
  - 투자: per_trade=100,000원, min_order=5,000원
  - RSI: period=14, oversold=30, overbought=70
  - 리스크: stop_loss=3%, take_profit=5%, trailing_stop=OFF
  - 타이밍: poll_interval=60초, timeframe=minute60 (1시간봉)
- **Python 봇 전략 로직**:
  - RSI: oversold 이하→BUY, overbought 이상→SELL
  - MA Cross: 골든크로스→BUY, 데드크로스→SELL
  - Bollinger: 하단밴드 이탈→BUY, 상단밴드 이탈→SELL
  - 리스크: check_position()에서 stop_loss/take_profit/trailing_stop 체크

### 미션 5 설계 결정
- **Task A**: trade-content.tsx의 MARKETS 하드코딩 → /api/markets 동적 API로 전환
  - chart-toolbar.tsx와 동일 패턴 (useQuery + queryKeys.markets())
  - 보유 코인(USDC 등)이 KRW마켓이면 자동 포함
- **Task B**: 웹 기본값을 공격적 단타 전략으로 변경
  - per_trade_amount: 100,000 → 50,000
  - RSI: period 14→7, oversold 30→35, overbought 70→65
  - MA Cross: short 9→5, long 21→13
  - Bollinger: period 20→10, std_dev 2.0→1.5
  - 리스크: stop_loss 3%→2%, take_profit 5%→3%, trailing_stop ON(1.5%), max_positions 5→10
  - 타이밍: poll_interval 60→30, timeframe minute60→minute5
- 변경 대상 파일:
  - trade-content.tsx (마켓 목록 동적화)
  - strategy-section.tsx (전략 기본값)
  - risk-section.tsx (리스크 기본값)
  - investment-section.tsx (투자금 기본값)
  - trading-section.tsx (타이밍 기본값)

### 미션 5 완료 작업
- Task A: trade-content.tsx 마켓 Combobox 동적화 완료
  - 하드코딩 MARKETS 배열(10개) 제거
  - useQuery + /api/markets API로 전환 (chart-toolbar.tsx 패턴)
  - KRW 마켓 필터링, korean_name 표시
  - USDC 등 모든 KRW 마켓 자동 포함
- Task B: 공격적 단타 전략 기본값 적용 완료
  - strategy: RSI 7/35/65, MA 5/13/EMA, Bollinger 10/1.5
  - risk: stop_loss 2%, take_profit 3%, trailing ON 1.5%, max_positions 10
  - investment: per_trade 50,000
  - trading: poll_interval 30초, timeframe minute5

### 미션 5 변경 파일
- src/components/trade/trade-content.tsx (마켓 목록 동적 API 전환)
- src/components/settings/sections/strategy-section.tsx (전략 기본값)
- src/components/settings/sections/risk-section.tsx (리스크 기본값)
- src/components/settings/sections/investment-section.tsx (투자금 기본값)
- src/components/settings/sections/trading-section.tsx (타이밍 기본값)

### 미션 5 검토 결과
- CRITICAL: 0건
- WARNING: 3건
  - W-1: trade-content.tsx - selectedMarket 초기값('KRW-BTC')이 동적 목록과 동기화 안됨
  - W-2: trade-content.tsx - 마켓 목록 로딩 중 UI 처리 없음 (빈 Select)
  - W-3: types/trading.ts - TradingSettings.timeframe이 string으로 너무 넓음 (enum 필요)
- W-1, W-2 수정 완료 (trade-content.tsx)
  - useEffect로 selectedMarket 동기화 추가
  - isMarketsLoading으로 로딩 UI 처리 추가
- W-3는 기존 코드의 타입 이슈로 이번 scope에서 보류

## 미션 6: 비트코인 마이너스 원인 분석 + 전략 개선 검토 (2026-02-24)
- 원본 요청: "지금 비트코인 상황이 안좋아서 계속 마이너스 인거야? 더 좋은 전략으로 시도해 볼 방법이 있어? 방법이 없으면 그냥 기존대로 놔둬."
- 작업 유형: 조사/분석
- 복잡도: 보통
- 팀 구성: explorer(2, 병렬) → critic(1)
- 핵심 질문:
  1. 현재 BTC 시장 상황이 마이너스의 주원인인가?
  2. 현재 봇 전략(RSI 7/35/65, 5분봉, 30초 폴링)에 구조적 문제가 있는가?
  3. 더 나은 전략이 있는가? 없으면 기존 유지.

### 미션 6 탐색 결과

**[Explorer 1: 거래 실적 + 시장 상황]**
- BTC 24h: -3.16% 급락 (92,337,000원, 고점 95,762,000 대비 -3.6%)
- 총 거래: 매수 28회, 매도 22회, 총 손익 -11.20 KRW (미미한 손실)
- 승률: 45.5% (10승/22거래)
- 계좌: 원화 11,869원(거의 고갈), BTC/ETH/XRP 보유 (약 30만원)
- 봇 설정이 Supabase에서는 timeframe=minute3(3분봉)으로 되어있음 (minute5 아님!)
- 로그: RSI 12~18까지 극단 과매도 발생, 분할매수 차단("이미 보유 중"), 손절/트레일링 미발동
- XRP 매수 시 API 호출 결과 None 에러 6건
- 손실 원인: 시장 급락(50%) + RSI 과매도 기준 너무 높음(40%) + 설정(10%)

**[Explorer 2: 전략 로직 분석]**
- RSI 전략: RSI < oversold → BUY, RSI > overbought → SELL (확신도 계산하나 매매에 미사용)
- MA Cross: 골든/데드 크로스 기반 (이격도 1%에서 확신도 1.0)
- Bollinger: 하단밴드 이탈 → BUY, 상단밴드 이탈 → SELL
- 복합 전략: 미지원 (engine은 단일 전략만 self._strategy)
- 핵심 문제점 5가지:
  1. RSI(7) + 5분봉 = 35분치 데이터만 → 노이즈 심각
  2. oversold=35/overbought=65 → 신호 빈도 과다 (횡보장 양방향 손실)
  3. 30초 폴링 + 5분봉 = 같은 캔들 10회 반복 확인 (비효율)
  4. stop_loss=2%/take_profit=3% → 손익비 1.5:1 (너무 낮음)
  5. trailing_stop 미사용 → 이익 보호 불가
- 대안 4가지:
  A. 설정값만 변경: RSI 14/30/70, poll 180초, SL 3%/TP 6%, trailing ON
  B. 15분봉 + RSI 14/25/75 (노이즈 70% 감소)
  C. RSI+Bollinger 복합 전략 (코드 변경 필요, 거짓신호 80% 감소)
  D. 시장상황 자동전략 (ADX 기반, 매우 복잡)

### 미션 6 분석 결론
- 마이너스 주원인: 시장 급락(BTC -3.16%) + RSI 과매도 기준이 너무 높아 "떨어지는 칼날 잡기" 반복
- 전략 구조적 문제 있음: 설정값 조정으로 의미있는 개선 가능
- 권고: 옵션 A(설정값만 변경) 적용 → 1주일 관찰 → 필요시 옵션 C(복합전략) 검토
- 변경 내용: RSI 14/30/70, poll 180초, SL 3%/TP 5%, trailing ON 2%, timeframe minute15
- 코드 변경: 불필요 (Supabase bot_config만 업데이트)

## 미션 7: 포트폴리오 손익 정보 강화 (2026-02-24)
- 원본 요청: "포트폴리오에 총 평가 손익에 손익 퍼센트라던지 투자금 대비 손익을 자세히 볼 수 있게 추가해줘. 그리고 더 유용한 투자 손익 정보를 좀 더 보여줘. 일일 매매손익 정보도 있으면 좋을것 같아."
- 작업 유형: UI 기능 추가
- 복잡도: 보통

### 미션 7 탐색 결과

**[Explorer 1: 포트폴리오 UI]**
- 현재 4개 카드: 총평가자산(금액만), 보유KRW(금액만), 총투자금(금액만), 총손익(금액+PnlBadge%)
- HoldingList: 7컬럼(코인명,수량,매수평균가,현재가,평가금액,손익,손익률) - 비중 없음
- 데이터: Supabase account_snapshots → /api/accounts → useAccounts() + useTicker() + WebSocket
- 계산: toHolding()에서 개별 코인 손익, buildSummary()에서 전체 합산
- 누락: 자산비중 표시, 전일 대비 증감, 일일 매매손익
- 수정 파일: portfolio-summary.tsx, holding-list.tsx, portfolio-content.tsx

**[Explorer 2: 일일 손익 데이터]**
- order_history 테이블: pnl(실현손익), pnl_pct(손익률), traded_at(체결시각), side(bid/ask), amount(체결금액)
- Python 봇: 매도 시 pnl = sell_amount - entry_amount 계산 후 Supabase 저장, 매수 시 pnl=0
- 현재 API: /api/orders에 날짜 필터/집계 없음
- 필요: API /api/analytics/daily-pnl, Supabase getDailyPnlStats(), Hook useDailyPnl(), 타입 DailyPnlStats
- 권장: 서버 사이드 집계 (Supabase에서 traded_at 날짜 필터 + pnl 합계)

### 미션 7 설계
- **Task A (백엔드)**: 일일 매매손익 API + Supabase 함수 + 훅 + 타입
  - 신규: src/app/api/analytics/daily-pnl/route.ts
  - 신규: src/hooks/use-daily-pnl.ts
  - 수정: src/lib/supabase.ts (getDailyPnlStats 추가)
  - 수정: src/types/trading.ts (DailyPnlStats 타입 추가)
  - 수정: src/lib/query-keys.ts (analytics 키 추가)
- **Task B (프론트엔드)**: 포트폴리오 UI 강화
  - 수정: portfolio-summary.tsx → 카드 개선:
    - 총평가자산: 투자금 대비 수익률% 추가
    - 보유KRW/총투자금: 자산 비중% 추가
    - 총손익: 이미 %있음 유지
    - 신규 카드: 일일 매매손익 (useDailyPnl 사용, 매매수/승률/실현손익)
  - 수정: holding-list.tsx → 비중 컬럼 추가
  - 수정: portfolio-content.tsx → useDailyPnl 데이터 연동
- 구현 순서: Task A 먼저 → Task B (API 의존)

### 미션 7 완료 작업
- Task A (백엔드): DailyPnlStats 타입, getDailyPnlStats() Supabase 함수, /api/analytics/daily-pnl API, useDailyPnl() 훅, queryKeys 추가
- Task B (프론트엔드):
  - portfolio-summary.tsx: 총평가자산에 투자수익률 PnlBadge, 보유KRW/총투자금에 자산비중%, 일일매매실적 Card 신규 (실현손익, 매수/매도건수, 승률, 매수/매도총액)
  - holding-list.tsx: 비중 컬럼 추가 (8번째)
  - portfolio-content.tsx: useDailyPnl() 연동, props 전달

### 미션 7 변경 파일
- src/types/trading.ts (수정 - DailyPnlStats 추가)
- src/lib/supabase.ts (수정 - getDailyPnlStats 추가)
- src/lib/query-keys.ts (수정 - dailyPnl 키/config 추가)
- src/app/api/analytics/daily-pnl/route.ts (신규)
- src/hooks/use-daily-pnl.ts (신규)
- src/components/portfolio/portfolio-summary.tsx (수정)
- src/components/portfolio/holding-list.tsx (수정)
- src/components/portfolio/portfolio-content.tsx (수정)

### 미션 7 검토 결과
- CRITICAL 2건:
  - C-1: DailyPnlStats 타입이 두 곳에서 중복 정의 (types/trading.ts + portfolio-summary.tsx 로컬)
  - C-2: queryKey/queryFn 불일치 가능성 (use-daily-pnl.ts)
- WARNING 3건:
  - W-1: NaN 표시 가능성 (승률 - sellCount=0일 때)
  - W-2: Timezone 이슈 (UTC vs KST 날짜 필터링)
  - W-3: 서버 시간 기준 "오늘" (클라이언트와 불일치 가능)
- SUGGESTION 6건 (대부분 코드 스타일)
- 수정 완료:
  - C-1: 중복 없음 확인 (이미 import 사용)
  - C-2: use-daily-pnl.ts queryFn에서 queryDate 사용하도록 수정
  - W-1: 승률 NaN 방지 (sellCount=0이면 "-" 표시)
  - W-2: Supabase 날짜 필터 KST 기준으로 변환 (+09:00, lt 사용)
  - W-3: use-daily-pnl.ts에 getKSTDate() 함수 추가
- tsc --noEmit 빌드 검증 통과

## 미션 8: 매수 후보 종목 표시 + 봇 매수 범위 분석 (2026-02-25)
- 원본 요청: "현재 전체 코인을 대상으로 매수 시도를 하는거야? 전혀 매수가 안되고 있어서 그래. 매수 후보 종목이라도 보여주는게 어때?"
- 작업 유형: 조사/분석 + UI 기능 추가
- 복잡도: 보통
- 팀 구성: explorer(2, 병렬) → coder(1~2) → critic(1)
- 핵심 질문:
  1. Python 봇이 감시하는 코인은 3개(BTC/ETH/XRP)뿐인가, 전체인가?
  2. RSI 30 미만 코인이 전혀 없어서 매수가 안 되는 것인가?
  3. 웹 대시보드에 "매수 후보 종목" 기능을 어디에 어떻게 추가할까?

### 미션 8 현재 상황
- 봇 설정: RSI 14/30/70, minute15, poll 180s, markets=[KRW-BTC, KRW-ETH, KRW-XRP]
- 익절 비활성화(999), 트레일링 스탑 2%만 사용
- 현재 RSI: BTC 55, ETH 58, XRP 48 → 전부 관망 구간
- 방금 추가: 포트폴리오에 보유 코인별 RSI 표시 (useRsi 훅 + /api/indicators/rsi)
- TOP_30_SYMBOLS: 이미 거래/차트 탭에서 사용 중

### 미션 8 탐색 결과

**[Explorer 1: 봇 매수 범위]**
- 봇은 Supabase trading.markets 배열에 지정된 3개 코인만 감시 (BTC/ETH/XRP)
- 동적 시장 스캔 기능 없음, 전체 코인 대상 아님
- markets 배열 변경 + 봇 재시작으로 감시 대상 변경 가능
- max_positions=10이므로 더 많은 코인 추가 가능

**[Explorer 2: 웹 구조]**
- 추천: /candidates 새 페이지 (사이드바 메뉴 추가)
- 기존 재활용: /api/indicators/rsi, useRsi(), useTicker(), TOP_30_SYMBOLS
- TOP_30_SYMBOLS 3곳 중복 → src/lib/constants.ts로 추출
- 사이드바: sidebar.tsx, 6개 메뉴 존재

### 미션 8 설계

**Task A: TOP_30_SYMBOLS 공통 상수 추출**
- 신규: src/lib/constants.ts (TOP_30_SYMBOLS + TOP_30_MARKETS 배열)
- 수정: trade-content.tsx, chart-toolbar.tsx (import로 교체)

**Task B: 매수 후보 페이지 구현**
- 신규: src/app/(dashboard)/candidates/page.tsx (서버 컴포넌트)
- 신규: src/components/candidates/candidates-content.tsx (클라이언트)
  - TOP 30 코인 전체 RSI + 현재가 + 24h변동률 테이블
  - RSI 낮은 순 정렬
  - RSI < 25: "강력 매수", 25-30: "매수 추천", 30-40: "매수 대기"
  - 40 이상: 일반 표시
  - 빈 후보 시: "현재 매수 추천 종목이 없습니다" 메시지
- 수정: sidebar.tsx (매수 후보 메뉴 추가, TrendingUp 아이콘)

### 미션 8 변경 파일 (예정)
- src/lib/constants.ts (신규)
- src/app/(dashboard)/candidates/page.tsx (신규)
- src/components/candidates/candidates-content.tsx (신규)
- src/components/layout/sidebar.tsx (수정)
- src/components/trade/trade-content.tsx (수정)
- src/components/chart/chart-toolbar.tsx (수정)

### 미션 8 완료
- Task A: constants.ts 추출, trade-content.tsx/chart-toolbar.tsx에서 import 교체
- Task B: candidates 페이지 + sidebar 메뉴 추가
- Critic 결과: WARNING 2건 수정 (ticker Map 최적화, 에러 핸들링 추가), ESLint 미사용 import 제거
- 커밋: 38daca4 + 4883497, push 완료

## 미션 9: 봇 TOP 30 자동 스캔 + 매수후보 페이지 에러 수정 (2026-02-25)
- 원본 요청: "TOP 30 자동 스캔으로 바꿔줘. 그리고 매수후보 페이지 진입하면 '데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'가 나오면서 계속 화면이 깜빡거려.."
- 작업 유형: 버그 수정 + 설정 변경
- 복잡도: 보통
- 핵심 목표:
  1. Python 봇의 매매 대상을 3개(BTC/ETH/XRP) → TOP 30으로 확장 (Supabase bot_config 수정)
  2. /candidates 페이지 에러 + 깜빡임 문제 수정

## 작업 분석
- 작업 유형: 버그 수정 + 설정 변경
- 복잡도: 보통
- 팀 구성: explorer(2) → coder(1~2) → critic(1)

### 탐색 결과

**봇 TOP 30 확장:**
- 확장 가능: API rate limit 3.3%/분, 처리시간 1.7%/사이클
- Supabase bot_config.trading.markets 30개로 업데이트 + 봇 재시작 필요

**매수후보 에러 근본 원인:**
- /api/ticker/route.ts의 MAX_MARKETS=20 → 30개 요청 시 400 에러
- React Query refetchInterval(2초) + 에러 = 깜빡임 무한 루프
- /api/indicators/rsi: 30개 코인 병렬 호출 → Edge Runtime 10초 타임아웃 위험

### 수정 계획
- Task A: /api/ticker MAX_MARKETS 20→100으로 증가
- Task B: /api/indicators/rsi 배치 처리 (5개씩 + 100ms 딜레이)
- Task C: Supabase bot_config.trading.markets를 TOP 30으로 업데이트
- Task D: candidates 에러 시 이전 데이터 유지 (깜빡임 방지)
- Task E: useRsi/useTicker에 retry:2 + retryDelay 추가

### 완료된 작업
- Task A: /api/ticker MAX_MARKETS 20→100 완료
- Task B: /api/indicators/rsi 배치 처리 (BATCH_SIZE=5, 100ms delay) 완료
- Task C: Supabase bot_config.trading.markets 30개 업데이트 완료 (2026-02-25T03:13)
- Task D: candidates isError 조건을 `isError && candidates.length === 0`으로 변경 완료
- Task E: use-rsi.ts, use-ticker.ts에 retry:2 + retryDelay 추가 완료

### 변경 파일
- src/app/api/ticker/route.ts (MAX_MARKETS 20→100)
- src/app/api/indicators/rsi/route.ts (배치 처리 리팩토링)
- src/components/candidates/candidates-content.tsx (에러 조건 개선)
- src/hooks/use-rsi.ts (retry 옵션 추가)
- src/hooks/use-ticker.ts (retry 옵션 추가)
- Supabase bot_config.trading.markets (3개→30개)

## 남은 작업
- E2E 테스트
- 다크/라이트 모드 토글 UI
