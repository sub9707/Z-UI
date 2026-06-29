# Z-UI 개발 로드맵

> Zustand 상태 관리를 위한 시각적 설계 및 디버깅 빌더

---

## 현재 상태

```
✅ 모노레포 구조 (pnpm workspace)
✅ packages/core  — tsup 빌드 설정, pass-through stub
✅ packages/gui   — Vite + React 스캐폴딩
✅ examples/basic — 3개 테스트 스토어 (counter, auth, cart)
```

---

## Phase 1 — Core: 미들웨어 & 서버

### Step 1. 메시지 프로토콜 정의
**파일:** `packages/core/src/protocol.ts`

GUI ↔ 앱 사이에 오가는 모든 메시지 타입을 먼저 확정.
나머지 모든 코드가 이 타입 위에서 작성된다.

```ts
// 앱 → GUI
type ServerMessage =
  | { type: "STORE_INIT";   storeName: string; state: unknown; actions: string[] }
  | { type: "STATE_UPDATE"; storeName: string; state: unknown; actionName: string }
  | { type: "STORE_REMOVED"; storeName: string }

// GUI → 앱
type ClientMessage =
  | { type: "STATE_PATCH";       storeName: string; patch: unknown }
  | { type: "SNAPSHOT_RESTORE";  storeName: string; snapshot: unknown }
  | { type: "REQUEST_STORES" }
```

**완료 기준:** 타입 파일이 컴파일 에러 없이 빌드됨

---

### Step 2. WebSocket 서버
**파일:** `packages/core/src/server.ts`

- `ws` 패키지로 로컬 WebSocket 서버 구동 (기본 포트 `3274`)
- 연결된 GUI 클라이언트 목록 관리 (Set)
- 메시지 브로드캐스트 함수 export
- GUI로부터 `STATE_PATCH` / `SNAPSHOT_RESTORE` 수신 시 콜백 호출

```ts
// 외부에서 쓸 인터페이스
export function createZuiServer(port?: number): ZuiServer
export type ZuiServer = {
  broadcast: (msg: ServerMessage) => void
  onClientMessage: (handler: (msg: ClientMessage) => void) => void
  close: () => void
}
```

**의존성 추가:**
```bash
pnpm --filter @z-ui/core add ws
pnpm --filter @z-ui/core add -D @types/ws
```

**완료 기준:** `createZuiServer()` 호출 시 서버가 뜨고 `wscat` 등으로 연결 확인

---

### Step 3. Store Registry
**파일:** `packages/core/src/registry.ts`

- 등록된 스토어 목록을 Map으로 관리
- 스토어 등록 / 해제 / 전체 조회 함수 제공
- 서버 인스턴스와 연결하여 새 GUI 접속 시 전체 스토어 상태 전송

```ts
export type StoreEntry = {
  name: string
  getState: () => unknown
  setState: (patch: unknown) => void
  actions: string[]
}

export function registerStore(entry: StoreEntry): void
export function unregisterStore(name: string): void
export function getRegistry(): Map<string, StoreEntry>
```

**완료 기준:** 스토어 등록 후 registry에서 조회 가능

---

### Step 4. Zustand 미들웨어 구현
**파일:** `packages/core/src/middleware.ts`

이 프로젝트의 핵심. pass-through stub을 실제 동작하는 미들웨어로 교체.

- `set` 호출을 가로채서 변경된 state를 서버로 broadcast
- GUI에서 `STATE_PATCH`가 오면 스토어 state에 merge
- 액션 이름 추적: `set`을 호출한 함수명을 `STATE_UPDATE` 메시지에 포함

```ts
// 핵심 구현 형태
export const zui = (options: ZuiOptions) =>
  <T>(f: StateCreator<T, [], []>): StateCreator<T, [], []> =>
  (set, get, store) => {
    const wrappedSet: typeof set = (partial, replace) => {
      set(partial, replace as false)
      server.broadcast({ type: "STATE_UPDATE", storeName: options.name, state: get(), actionName: "..." })
    }
    const state = f(wrappedSet, get, store)
    registry.registerStore({ name: options.name, getState: get, setState: ..., actions: [...] })
    return state
  }
```

**완료 기준:** `examples/basic`에서 스토어 조작 시 터미널에 WebSocket 메시지 출력 확인

---

### Step 5. 진입점 정리 & 빌드 확인
**파일:** `packages/core/src/index.ts`

모든 public API를 export. 서버 자동 시작 옵션 추가.

```ts
export { zui } from "./middleware"
export { createZuiServer } from "./server"
export type { ZuiOptions, ServerMessage, ClientMessage } from "./protocol"
```

**빌드 확인:**
```bash
pnpm --filter @z-ui/core build
# dist/index.js, dist/index.cjs, dist/index.d.ts 생성 확인
```

---

## Phase 2 — GUI: 시각화 인터페이스

### Step 6. WebSocket 클라이언트 훅
**파일:** `packages/gui/src/hooks/useZuiSocket.ts`

- `ws://localhost:3274` 연결 및 재연결 로직
- 수신 메시지를 파싱하여 Zustand GUI 스토어로 dispatch
- 연결 상태 (connected / disconnected / error) 관리

```ts
export function useZuiSocket(): {
  isConnected: boolean
  send: (msg: ClientMessage) => void
}
```

---

### Step 7. GUI 내부 상태 스토어
**파일:** `packages/gui/src/store/zuiStore.ts`

GUI 자체의 상태를 관리하는 Zustand 스토어 (zui 미들웨어 없이 일반 create).

```ts
type ZuiStore = {
  stores: Record<string, StoreSnapshot>     // 연결된 앱의 스토어들
  selectedStore: string | null
  snapshots: SnapshotHistory[]
  // actions
  upsertStore: (name: string, state: unknown, actions: string[]) => void
  removeStore: (name: string) => void
  selectStore: (name: string) => void
  saveSnapshot: (name: string) => void
}
```

---

### Step 8. React Flow 캔버스
**파일:** `packages/gui/src/components/Canvas.tsx`

각 Zustand 스토어 = 노드 1개로 렌더링.

- 노드 내부에 스토어 이름, 현재 state 값 미리보기 표시
- 노드 클릭 시 우측 Inspector 패널 열기
- 스토어 간 subscribe 관계가 생기면 엣지로 연결 (Phase 3)

**의존성 추가:**
```bash
pnpm --filter @z-ui/gui add @xyflow/react
```

---

### Step 9. State Inspector 패널
**파일:** `packages/gui/src/components/Inspector.tsx`

선택한 스토어의 상세 뷰.

- 현재 state를 JSON 트리로 표시
- 값 직접 수정 → `STATE_PATCH` 메시지 전송 → 앱에 즉시 반영
- 액션 목록 표시 (향후 수동 트리거 기능)

---

### Step 10. GUI 레이아웃 조립
**파일:** `packages/gui/src/App.tsx`

```
┌─────────────────────────────────────────┐
│  Z-UI  ● connected                      │  ← Header (연결 상태)
├──────────────────────┬──────────────────┤
│                      │                  │
│   React Flow Canvas  │    Inspector     │
│   (스토어 노드들)      │   (선택된 스토어)  │
│                      │                  │
└──────────────────────┴──────────────────┘
```

---

## Phase 3 — 고급 기능

### Step 11. Snapshot / Time-travel
**파일:** `packages/gui/src/components/SnapshotPanel.tsx`

- 현재 전체 스토어 상태를 배열에 저장 (이름 + 타임스탬프)
- 목록에서 선택 → `SNAPSHOT_RESTORE` 전송 → 앱 전체 상태 복구
- 슬라이더 UI로 과거 상태 탐색

---

### Step 12. Action Log 타임라인
**파일:** `packages/gui/src/components/ActionLog.tsx`

- 액션 호출 히스토리를 시간순 리스트로 표시
- 각 항목: 스토어명 / 액션명 / 변경 전후 state diff
- 특정 시점 클릭 → 해당 시점 상태로 점프

---

### Step 13. 스토어 간 의존성 엣지 (선택)

- 스토어 A의 subscribe가 스토어 B의 액션을 호출하는 관계 감지
- React Flow 엣지로 시각화
- 미들웨어 레벨에서 cross-store 호출 추적 필요

---

## Phase 4 — 배포

### Step 14. 빌드 & 타입 검증
```bash
pnpm build:all
pnpm typecheck
```
- `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` 모두 존재 확인
- 외부에서 import 시 타입 자동완성 동작 확인

---

### Step 15. npm 배포
```bash
# packages/core/package.json 버전 올리기
pnpm --filter @z-ui/core publish --access public
```

- 배포 대상: `@z-ui/core` 만 (GUI는 GitHub에서 clone해서 사용)
- README 작성 (설치법, 기본 사용법, zui() API 문서)

---

## 개발 명령어 치트시트

```bash
# 의존성 설치
pnpm install

# 예제 앱 실행 (포트 5173)
pnpm dev:example

# GUI 실행 (포트 5274)
pnpm dev

# 둘 동시 실행
pnpm dev:all

# core 빌드
pnpm build

# 타입 체크 전체
pnpm typecheck
```

---

## 파일 구조 전체

```
Z-UI/
├── examples/
│   └── basic/                   ← 테스트용 React 앱
│       └── src/stores/
│           ├── counterStore.ts  ← 동기 상태 테스트
│           ├── authStore.ts     ← 비동기 + loading 테스트
│           └── cartStore.ts     ← 복잡한 파생 계산 테스트
├── packages/
│   ├── core/                    ← npm 배포 라이브러리
│   │   └── src/
│   │       ├── index.ts         ← public API export
│   │       ├── protocol.ts      ← [Step 1] 메시지 타입
│   │       ├── server.ts        ← [Step 2] WebSocket 서버
│   │       ├── registry.ts      ← [Step 3] 스토어 레지스트리
│   │       └── middleware.ts    ← [Step 4] zui() 미들웨어 ★
│   └── gui/                     ← 시각화 GUI 앱
│       └── src/
│           ├── App.tsx          ← [Step 10] 레이아웃
│           ├── hooks/
│           │   └── useZuiSocket.ts  ← [Step 6] WS 클라이언트
│           ├── store/
│           │   └── zuiStore.ts  ← [Step 7] GUI 내부 상태
│           └── components/
│               ├── Canvas.tsx       ← [Step 8] React Flow
│               ├── Inspector.tsx    ← [Step 9] 상태 편집기
│               ├── SnapshotPanel.tsx← [Step 11] 타임트래블
│               └── ActionLog.tsx    ← [Step 12] 액션 히스토리
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```
