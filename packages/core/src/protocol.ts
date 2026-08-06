// ── ServerMessage: 앱 → GUI 방향 ──────────────────────────

// 스토어 최초 등록 시
interface StoreRegisterMessage {
  type: "STORE_REGISTER";
  name: string;
  initialState: unknown;
  actions: string[];
  color?: string | undefined;
}

// state가 바뀔 때마다
interface StoreUpdateMessage {
  type: "STORE_UPDATE";
  name: string;
  newState: unknown;
  action: string;
  timestamp: number;
}

// 스토어 제거 시
interface StoreRemoveMessage {
  type: "STORE_REMOVE";
  name: string;
}

// SCAFFOLD_STORE / DELETE_STORE 처리 결과 알림
interface StoreActionResultMessage {
  type: "STORE_ACTION_RESULT";
  name?: string;
  success: boolean;
  reason?: string;
}

export type ServerMessage =
  | StoreRegisterMessage
  | StoreUpdateMessage
  | StoreRemoveMessage
  | StoreActionResultMessage;

// ── ClientMessage: GUI → 앱 방향 ──────────────────────────

// GUI에서 state 값 수정 시
interface SetStateMessage {
  type: "SET_STATE";
  name: string;
  newState: unknown;
}

// 스냅샷 복구 요청 시
interface RestoreSnapshotMessage {
  type: "RESTORE_SNAPSHOT";
  name: string;
  snapshot: unknown;
}

// GUI가 처음 연결돼서 스토어 목록 요청 시
interface RequestStoreListMessage {
  type: "REQUEST_STORE_LIST";
}

// GUI에서 새 스토어 보일러플레이트 생성 요청 시
interface ScaffoldStoreMessage {
  type: "SCAFFOLD_STORE";
  name: string;
  fields: { name: string; type: string }[];
  register: boolean;
  color:string;
}

// GUI에서 스토어 파일 삭제 요청 시
interface DeleteStoreMessage {
  type: "DELETE_STORE";
  name: string;
}

// GUI에서 스토어 색상 변경 요청 시 (소스 파일의 zui(...) 호출을 직접 수정)
interface UpdateStoreColorMessage {
  type: "UPDATE_STORE_COLOR";
  name: string;
  color: string;
}

export type ClientMessage =
  | SetStateMessage
  | RestoreSnapshotMessage
  | RequestStoreListMessage
  | ScaffoldStoreMessage
  | DeleteStoreMessage
  | UpdateStoreColorMessage;
