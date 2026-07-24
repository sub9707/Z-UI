# Z-UI

> Zustand 상태 관리를 위한 시각적 개발 도구 — "상태 관리를 위한 스토리북"

**개발 중인 프로젝트입니다.** 아직 npm에 배포되지 않았고, 핵심 기능도 진행 중입니다. 

아래 [개발 현황](#개발-현황)에서 진행 상태를 확인하세요.

개발 과정은 [개발 블로그](https://subdevpi.mywire.org/posts/etc/%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%AC-%EA%B0%9C%EB%B0%9C%EA%B8%B0-(1)-%E2%80%94-%EC%A3%BC%EC%A0%9C-%EC%84%A0%ED%83%9D)에 포스팅 중입니다.

## 이게 뭔가요

React 앱에서 [Zustand](https://github.com/pmndrs/zustand) 스토어를 등록하면, 별도의 GUI 앱이 WebSocket으로 연결되어 스토어의 상태와 액션을 실시간으로 시각화·조작할 수 있게 해주는 개발자 도구입니다.

기존 Redux/Zustand DevTools가 상태 변화를 "관찰"하는 데 그친다면, Z-UI는 GUI에서 상태를 직접 생성/편집하고, 스냅샷을 저장/복원하고, 스토어 간 의존성을 그래프로 그려보는 등 **시각적이고 직관적인 상태 로직 설계·디버깅**을 목표로 합니다.

- 브라우저 확장이 아닌 **독립 서버 기반 GUI** (`npx z-ui`로 실행, 멀티 모니터 지원)
- 앱의 dev 서버와 완전히 분리된 프로세스 — Storybook과 유사한 구조

## 구조

```
@z-ui/core   앱에 설치하는 라이브러리 (Zustand 미들웨어 + Vite 플러그인)
@z-ui/gui    npx z-ui로 실행하는 독립 GUI 앱 (React + Vite + React Flow)
examples/    @z-ui/core 동작 검증용 테스트 앱
```

## 개발 현황

### 완료

- **Phase 1 — Core 라이브러리**
  - 메시지 프로토콜 설계 (`protocol.ts`)
  - WebSocket 서버 (`server.ts`)
  - Store Registry (`registry.ts`)

### 진행 중

- **Phase 1 — Store Observer** (`zui` / `initZui`, `packages/core/src/index.ts`)
  - 스토어 등록 및 WebSocket 연결, `STORE_REGISTER`/`STORE_UPDATE` 송신까지 구현
  - GUI → 앱 방향 메시지 처리(`SET_STATE`, `RESTORE_SNAPSHOT` 등)와 무한 루프 방지 로직 작업 중

### 예정

- **Phase 1** — 진입점 정리 & 빌드, Vite 플러그인 분리, `npx z-ui` CLI, 스토어 보일러플레이트 생성/삭제
- **Phase 2** — GUI 기본 통신 & CRUD (WebSocket 클라이언트 훅, 내부 상태 관리, CRUD 패널)
- **Phase 3** — GUI 시각화 (React Flow 캔버스, 레이아웃)
- **Phase 4** — 고급 기능 (Snapshot/Time-travel, Action Log, 스토어 의존성 그래프)
- **Phase 5** — 빌드 검증 & npm 배포

## 로컬에서 실행해보기

아직 npm 배포 전이므로, 저장소를 클론해 워크스페이스로 실행합니다.

```bash
pnpm install
pnpm dev:all      # examples/basic(5173) + GUI(5274) + WebSocket 서버(3274) 동시 실행
```

## 기술 스택

TypeScript · Zustand Middleware API · React · Vite · React Flow · WebSocket (`ws`) · tsup · pnpm workspace

## 라이선스

[MIT](./LICENSE)
