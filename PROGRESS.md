# Phase 1 진행 기록 — Core 라이브러리

> Phase 0(Zustand 내부 구조 이해)을 마치고, Phase 1(Core 라이브러리)에서 실제로 진행한
> 과제 1-1 ~ 1-3의 기록. 무엇을 했고, 어떻게 접근했고, 어떤 문제가 있었고, 뭘 배웠는지 정리.

---

## 과제 1-1. 메시지 프로토콜 설계 (`packages/core/src/protocol.ts`)

### 한 일
GUI ↔ 앱 사이에 오가는 메시지 타입을 `ServerMessage`(앱→GUI), `ClientMessage`(GUI→앱)
두 그룹으로 나눠 discriminated union으로 설계.

- `ServerMessage`: `STORE_REGISTER`, `STORE_UPDATE`, `STORE_REMOVE`, `STORE_ACTION_RESULT`
- `ClientMessage`: `SET_STATE`, `RESTORE_SNAPSHOT`, `REQUEST_STORE_LIST`, `SCAFFOLD_STORE`, `DELETE_STORE`

### 어떻게 접근했나
각 상황(메시지 종류)별로 `interface`를 만들고, `type: "리터럴"` 필드로 구분한 뒤
`|`로 묶는 discriminated union 패턴을 사용.

### 실제 겪은 문제
- **범위 초과(scope creep)**: `ScaffoldStoreMessage`의 `fields`에 로드맵이 요구한
  `{ name, type }` 외에 `color`, `isShown` 같은 GUI 표시용 속성을 미리 추가했었음.
  프로토콜 설계 단계에서 아직 안 만든 GUI의 관심사(스타일링/표시 여부)를 앞당겨 넣은 것으로,
  최소 스펙만 정의해야 하는 이 단계의 범위를 벗어난 것이었음 → `{ name, type }`만 남기고 제거.
- **불필요한 주석**: 필드마다 "포함할 것: ..." 주석과 `// TODO`를 남겨뒀었는데, 필드가
  다 채워진 뒤엔 코드 자체가 이미 그 내용을 보여주므로 중복 → 정리하고 "언제 보내는
  메시지인지"(컨텍스트/WHY)만 남김.

### 배운 것
- discriminated union으로 여러 메시지 종류를 하나의 타입에 안전하게 묶는 법.
- "지금 단계에서 필요한 것"과 "나중에 필요할 것"을 구분하는 감각 — 필드 하나를 추가할 때도
  "이게 왜 지금 필요한가"를 스스로 검증해야 조기 설계가 안 생김.

---

## 과제 1-2. WebSocket 서버 구현 (`packages/core/src/server.ts`)

### 한 일
`ws` 패키지의 `WebSocketServer`를 감싼 `createZuiServer()` 팩토리 함수를 작성.
`ZuiServer` 인터페이스(`broadcast`, `onMessage`, `closeServer`)를 구현하고, 싱글턴 패턴 적용.

### 어떻게 접근했나
1. `ZuiServer` 인터페이스부터 설계 (broadcast / onMessage / closeServer)
2. `wss.on("listening"/"connection", ...)`, `ws.on("message"/"close", ...)` 이벤트를
   각각 알맞은 대상(서버 전체 vs 개별 클라이언트)에 등록
3. `wss.clients`(Set)를 순회하며 `broadcast` 구현
4. 모듈 레벨 변수(`zuiServerInstance`)로 싱글턴 구현
5. `npx tsx src/server.ts`로 직접 실행해 브라우저 콘솔과 양방향 통신 검증

### 실제 겪은 문제 (시행착오가 많았던 과제)
- **함수 껍데기 자체의 문법 오류**: `const createZuiServer(options): ZuiServer => {}`처럼
  일반 함수 선언과 화살표 함수 문법을 섞어 씀. `=`, `=>` 위치를 바로잡아야 했음.
  타입 자리에 기본값(`{port?: number = 3274}`)을 넣으려던 시도도 문법 오류 — 타입과 값은
  다른 자리라는 걸 헷갈렸던 부분.
- **이벤트 위치 착각**: `connection`(클라이언트 접속) 이벤트를 `broadcast` 함수 **안에**
  등록해서, `broadcast`를 부를 때마다 리스너가 계속 쌓이는 문제. `connection`은 서버 생성
  시 **딱 한 번**만 등록해야 하는데, "함수가 호출될 때 뭘 해야 하는지"와 "언제 한 번만
  등록해두면 되는지"를 구분 못 해서 생긴 문제.
- **`wss`와 `ws`의 이벤트 혼동**: `wss.on("message", ...)`처럼 서버 전체 객체에
  메시지 이벤트를 걸려고 했으나, `"message"`는 **개별 클라이언트 소켓(`ws`)**에서만
  발생. `@types/ws`의 타입 정의(`on(event: "connection" | "error" | ... )`)를 직접
  찾아보고서야 `wss`에는애초에 `"message"` 이벤트가 없다는 걸 확인.
- **등록만 하고 실행은 안 함**: `closeServer()` 안에 `wss.on("close", ...)`(리스너 등록)만
  써놓고 실제로 서버를 닫는 `wss.close()` 호출이 없어서 아무 일도 안 일어나는 문제.
  "이벤트를 구독하는 것"과 "동작을 실행하는 것"을 같은 걸로 착각했던 부분.
- **onMessage가 handler를 어디에도 저장 안 함**: `onMessage(handler)`가 넘겨받은 handler를
  그냥 버리고 있어서, 나중에 실제 메시지가 와도 아무도 호출을 안 하는 상태였음 → 클로저로
  캡처되는 모듈/함수 스코프 변수(`let messageHandler`)에 저장해두고, `connection` 콜백
  안에서 그 변수를 참조하도록 수정.
- **싱글턴 로직이 절반만 구현됨**: `if (zuiServerInstance) return zuiServerInstance` 체크는
  넣었는데, 정작 새로 만든 인스턴스를 `zuiServerInstance`에 **대입하는 코드가 없어서** 체크가
  죽은 코드였음. "체크만 하고 저장을 안 하면 의미가 없다"는 걸 두 번의 피드백 끝에 스스로 발견.
- **콘솔 검증 중 타이밍(레이스 컨디션) 문제**:
  - `ws.onopen`을 `new WebSocket(...)` 실행 직후 별도 줄로 입력했더니, `localhost`라
    연결이 너무 빨리 열려서 핸들러 등록 전에 이미 `open` 이벤트가 지나가버림 (로그 안 찍힘,
    서버 쪽엔 이미 `GUI connected` 찍혀 있어서 원인 파악).
  - `chrome://` 내부 페이지에서 콘솔 테스트 시도 → CSP(`connect-src`) 위반으로 연결 자체가
    차단됨. 일반 웹페이지 탭에서 열어야 했음.
  - `tsx`(watch 모드 아님)로 실행한 서버는 코드 저장해도 재시작되지 않음 → 코드 수정 후
    반드시 프로세스를 껐다 다시 켜야 한다는 걸 깨달음.

### 배운 것
- 이벤트 기반 API에서 "이 이벤트가 서버 전체 것인지, 개별 연결 것인지"를 타입 정의를 직접
  찾아보고 확인하는 습관.
- "리스너 등록"과 "실행"은 다른 개념 — 등록만 해두면 트리거하는 코드가 따로 있어야 동작함.
- 클로저를 활용해 여러 함수(연결 이벤트 콜백, `onMessage` 등록 함수)가 같은 상태
  (`messageHandler`)를 공유하게 만드는 패턴.
- 싱글턴 패턴의 핵심은 "모듈 레벨 변수에 저장 + 다음 호출에서 그 변수를 검사"의 **두 부분이
  다 있어야** 완성된다는 것.
- 브라우저 콘솔 테스트 시 레이스 컨디션, CSP, 프로세스 재시작 필요성 등 "코드는 맞는데
  검증 방법이 틀려서" 실패하는 경우가 실제로 꽤 많다는 것.

---

## 과제 1-3. Store Registry 구현 (`packages/core/src/registry.ts`)

### 한 일
스토어 이름 → `StoreEntry`(getState/setState/actions)를 저장하는 `Map` 기반 Registry와
CRUD 함수(`registerStore`, `unregisterStore`, `getRegistry`, `getStore`) 구현.
`temp-test.ts`로 `server.ts`와 연동해서 실제 브로드캐스트까지 검증.

### 어떻게 접근했나
1. `StoreEntry` 타입 설계 (name, getState, setState, actions)
2. 모듈 레벨 `Map<string, StoreEntry>` 변수 선언
3. CRUD 함수 4개를 `Map`의 기본 메서드(`set`/`get`/`delete`)로 구현
4. 단독 실행으로 등록/조회/해제 흐름 검증
5. `server.ts`를 import하는 임시 파일로 "등록 시 broadcast" 흐름까지 검증

### 실제 겪은 문제
- **개념 혼동**: "state를 외부에서 덮어쓰는 함수"를 "코드를 덮어쓰는 함수"로 오해했다가,
  실제로는 스토어의 상태 값 자체를 교체하는 연산(`setState`)이라는 걸 재확인.
- **연동 검증 타이밍 문제**: `temp-test.ts`의 `setTimeout(..., 2000)` — 브라우저 콘솔에
  손으로 `new WebSocket(...)` + `onmessage` 등록을 2초 안에 끝내지 못해 브로드캐스트를
  놓침. `과제 1-2`에서 겪은 것과 같은 종류의 레이스 컨디션 — 지연 시간을 10초로 늘려서 해결.
  (실제 앱에서는 `REQUEST_STORES` 요청-응답 구조라 이런 레이스가 아예 안 생긴다는 것도
  함께 확인 — 지금 겪은 문제는 순전히 "임시 시뮬레이션 코드"의 한계였음.)

### 배운 것
- Map이 Record보다 나은 진짜 이유는 "빠른 get/set"이 아니라(둘 다 지원)
  **프로토타입 오염 없이 임의의 키를 안전하게 다룰 수 있다는 것**, `.size`, 깔끔한
  순회 API 제공.
- 순환 의존성을 피하는 법: `registry.ts`와 `server.ts`가 서로를 몰라도 되도록,
  둘을 연결하는 책임을 제3의 파일(오케스트레이션 레이어)에 위임. 이 역할은 과제 1-4의
  `zui`/`initZui`가 맡게 됨.
- "브로드캐스트 자체는 정상 동작하는데 테스트 코드의 타이밍이 안 맞아서 실패"하는
  경우를 재차 경험 — 실패했을 때 "코드가 틀렸나"보다 "검증 방법과 타이밍이 맞았나"를
  먼저 의심하는 습관이 생김.

---

## 전체적으로 반복된 패턴

1. **함수 껍데기(화살표 함수 중첩, 클로저)를 여러 번 헷갈림** — `logger` 미들웨어부터
   `server.ts`의 `onMessage`까지, "지금 이 함수가 뭘 받고 뭘 반환해야 하는지"를
   먼저 확정하지 않고 코드를 쓰다가 막히는 패턴이 반복됨. → 앞으로도 새 함수를 짤 땐
   "인자/반환값 모양"부터 먼저 말로 정리하고 시작하는 게 도움이 될 것.
2. **콘솔 검증 단계에서 코드보다 타이밍/환경 문제로 막히는 경우가 잦음** — 레이스 컨디션,
   CSP, 프로세스 재시작 미흡 등. 코드 자체는 맞았던 경우가 대부분이라, 실패 시 "검증
   방법"을 먼저 점검하는 순서가 효율적.
3. **로드맵이 요구한 범위를 살짝 넘어서는 조기 설계**(예: `ScaffoldStoreMessage`에
   GUI 표시용 필드 추가)가 한 번 있었음 — "이 단계에 정말 필요한가"를 스스로 점검하는
   질문이 유효했음.
