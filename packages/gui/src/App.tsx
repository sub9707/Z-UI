import StorePanel from "./components/StorePanel";
import StoreCreateForm from "./components/StoreCreateForm";
import useZuiSocket from "./hooks/useZuiSocket";
import { useZuiStore } from "./store/zuiStore";

export default function App() {
  const { status, send } = useZuiSocket();
  const stores = useZuiStore((s) => s.stores);

  return (
    <div>
      <p>
        Status: {status} | Stores: {Object.keys(stores).length}
      </p>
      <StorePanel send={send} />
      <StoreCreateForm send={send} />
    </div>
  );
}
