import useZuiSocket from "./hooks/useZuiSocket";

export default function App() {
  const { status, send } = useZuiSocket()
  console.log('연결 상태: ', status)
  return <div>Z-UI</div>
}
