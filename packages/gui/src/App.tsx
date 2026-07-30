import StorePanel from "./components/StorePanel";
import useZuiSocket from "./hooks/useZuiSocket";
import { useZuiStore } from "./store/zuiStore";

export default function App() {
  const { status, send } = useZuiSocket();
  const stores = useZuiStore((s) => s.stores);

  return (
    <div>
      <p>
        상태: {status} | 스토어: {Object.keys(stores).length}개
      </p>
      <StorePanel send={send} />
    </div>
  );
}
