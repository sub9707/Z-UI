import { useState } from "react";
import { useCounterStore } from "./stores/counterStore";
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";

const SAMPLE_PRODUCTS = [
  { id: "p1", name: "Mechanical Keyboard", price: 120000 },
  { id: "p2", name: "USB-C Hub", price: 45000 },
  { id: "p3", name: "Monitor Stand", price: 32000 },
];

export default function App() {
  return (
    <div style={{ fontFamily: "monospace", padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ borderBottom: "2px solid #333", paddingBottom: "1rem", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Z-UI · Example Playground</h1>
        <p style={{ margin: "0.25rem 0 0", color: "#666", fontSize: "0.85rem" }}>
          zui() 미들웨어가 적용된 세 개의 스토어를 조작해보세요.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
        <CounterPanel />
        <AuthPanel />
        <CartPanel />
      </div>
    </div>
  );
}

/* ── Counter ── */
function CounterPanel() {
  const { count, step, increment, decrement, reset, setStep } = useCounterStore();

  return (
    <Panel title="counterStore" color="#4f6ef7">
      <Stat label="count" value={count} />
      <Stat label="step" value={step} />
      <Row>
        <Btn onClick={decrement}>- {step}</Btn>
        <Btn onClick={increment}>+ {step}</Btn>
        <Btn onClick={reset} variant="ghost">reset</Btn>
      </Row>
      <label style={labelStyle}>step 변경</label>
      <input
        type="range"
        min={1}
        max={10}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </Panel>
  );
}

/* ── Auth ── */
function AuthPanel() {
  const { user, isLoading, login, logout } = useAuthStore();
  const [name, setName] = useState("홍길동");
  const [role, setRole] = useState<"admin" | "user">("user");

  return (
    <Panel title="authStore" color="#22c55e">
      <Stat label="user" value={user ? user.name : "null"} />
      <Stat label="role" value={user ? user.role : "—"} />
      <Stat label="isLoading" value={String(isLoading)} />

      {!user ? (
        <>
          <label style={labelStyle}>name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <label style={labelStyle}>role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
            style={inputStyle}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <Btn onClick={() => login(name, role)} disabled={isLoading}>
            {isLoading ? "로그인 중..." : "login"}
          </Btn>
        </>
      ) : (
        <Btn onClick={logout} variant="ghost">logout</Btn>
      )}
    </Panel>
  );
}

/* ── Cart ── */
function CartPanel() {
  const { items, coupon, discountRate, addItem, removeItem, updateQty, applyCoupon, clearCart, total } =
    useCartStore();
  const [couponInput, setCouponInput] = useState("");

  return (
    <Panel title="cartStore" color="#f59e0b">
      <div style={{ marginBottom: "0.75rem" }}>
        {SAMPLE_PRODUCTS.map((p) => (
          <button
            key={p.id}
            onClick={() => addItem(p)}
            style={{ ...btnStyle, fontSize: "0.75rem", marginBottom: 4, width: "100%" }}
          >
            + {p.name} ({p.price.toLocaleString()}원)
          </button>
        ))}
      </div>

      {items.length > 0 && (
        <div style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <span style={{ flex: 1 }}>{item.name}</span>
              <button onClick={() => updateQty(item.id, item.qty - 1)} style={microBtn}>-</button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(item.id, item.qty + 1)} style={microBtn}>+</button>
              <button onClick={() => removeItem(item.id)} style={{ ...microBtn, color: "#ef4444" }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: "0.5rem" }}>
        <input
          placeholder="쿠폰코드 (SAVE10, SAVE20)"
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value)}
          style={{ ...inputStyle, flex: 1, margin: 0 }}
        />
        <Btn onClick={() => applyCoupon(couponInput)}>적용</Btn>
      </div>

      <Stat label="coupon" value={coupon ?? "없음"} />
      <Stat label="discount" value={`${(discountRate * 100).toFixed(0)}%`} />
      <Stat label="total" value={`${total().toLocaleString()}원`} />
      <Btn onClick={clearCart} variant="ghost">clear</Btn>
    </Panel>
  );
}

/* ── UI primitives ── */
function Panel({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${color}`, borderRadius: 8, padding: "1rem" }}>
      <div style={{ color, fontWeight: "bold", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ fontWeight: "bold" }}>{value}</span>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 4, margin: "0.5rem 0" }}>{children}</div>;
}

function Btn({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "ghost";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnStyle,
        background: variant === "ghost" ? "transparent" : "#333",
        color: variant === "ghost" ? "#666" : "#fff",
        border: variant === "ghost" ? "1px solid #444" : "none",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        flex: 1,
      }}
    >
      {children}
    </button>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "0.35rem 0.6rem",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.8rem",
  border: "none",
  background: "#333",
  color: "#fff",
};

const microBtn: React.CSSProperties = {
  padding: "0 6px",
  borderRadius: 3,
  border: "1px solid #444",
  background: "transparent",
  cursor: "pointer",
  fontSize: "0.75rem",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginBottom: "0.4rem",
  padding: "0.3rem 0.5rem",
  borderRadius: 4,
  border: "1px solid #444",
  background: "#1a1a1a",
  color: "#fff",
  fontFamily: "monospace",
  fontSize: "0.8rem",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  color: "#888",
  marginBottom: 2,
};
