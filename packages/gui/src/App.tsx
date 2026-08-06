import StorePanel from "./components/StorePanel";
import StoreCreateForm from "./components/StoreCreateForm";
import SnapshotPanel from "./components/SnapshotPanel";
import ActionLogPanel from "./components/ActionLogPanel";
import useZuiSocket from "./hooks/useZuiSocket";
import { useZuiStore } from "./store/zuiStore";
import Canvas from "./components/Canvas";
import Header from "./components/Header";

export default function App() {
  const { status, send } = useZuiSocket();
  const stores = useZuiStore((s) => s.stores);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header />
      <p>
        Status: {status} | Stores: {Object.keys(stores).length}
      </p>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1 }}>
          <Canvas />
        </div>
        <div style={{ width: 320, overflow: "auto" }}>
          <StorePanel send={send} />
          <StoreCreateForm send={send} />
          <SnapshotPanel send={send} />
          <ActionLogPanel />
        </div>
      </div>
    </div>
  );
}
