import Toolbar from "./components/Toolbar";
import InspectorPanel from "./components/InspectorPanel";
import ActionLogPanel from "./components/ActionLogPanel";
import useZuiSocket from "./hooks/useZuiSocket";
import { useZuiStore } from "./store/zuiStore";
import Canvas from "./components/Canvas";
import Header from "./components/Header";
import styles from "./App.module.css";

export default function App() {
  const { status, send } = useZuiSocket();
  const stores = useZuiStore((s) => s.stores);

  return (
    <div className={styles.app}>
      <Header status={status} storeCount={Object.keys(stores).length} />
      <div className={styles.main}>
        <div className={styles.canvasArea}>
          <Canvas />
          <Toolbar send={send} />
        </div>
        <InspectorPanel send={send} />
      </div>
      <ActionLogPanel />
    </div>
  );
}
