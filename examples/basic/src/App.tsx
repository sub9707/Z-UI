import { useState } from "react";
import { useCounterStore } from "./stores/counterStore";
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";
import "./App.css";

const SAMPLE_PRODUCTS = [
  { id: "p1", name: "Mechanical Keyboard", price: 120000 },
  { id: "p2", name: "USB-C Hub", price: 45000 },
  { id: "p3", name: "Monitor Stand", price: 32000 },
];

export default function App() {
  
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Z-UI · Example Playground</h1>
        <p className="app-subtitle">
          initZui로 관찰되는 순수 zustand 스토어 세 개를 조작해보세요.
        </p>
      </header>

      <div className="app-grid">
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
    <Panel title="counterStore" variant="counter">
      <Stat label="count" value={count} />
      <Stat label="step" value={step} />
      <Row>
        <Btn onClick={decrement}>- {step}</Btn>
        <Btn onClick={increment}>+ {step}</Btn>
        <Btn onClick={reset} variant="ghost">reset</Btn>
      </Row>
      <label className="field-label">step 변경</label>
      <input
        type="range"
        min={1}
        max={10}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        className="slider"
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
    <Panel title="authStore" variant="auth">
      <Stat label="user" value={user ? user.name : "null"} />
      <Stat label="role" value={user ? user.role : "—"} />
      <Stat label="isLoading" value={String(isLoading)} />

      {!user ? (
        <>
          <label className="field-label">name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
          <label className="field-label">role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
            className="input"
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
    <Panel title="cartStore" variant="cart">
      <div className="cart-products">
        {SAMPLE_PRODUCTS.map((p) => (
          <button
            key={p.id}
            onClick={() => addItem(p)}
            className="btn cart-product-btn"
          >
            + {p.name} ({p.price.toLocaleString()}원)
          </button>
        ))}
      </div>

      {items.length > 0 && (
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <span className="cart-item-name">{item.name}</span>
              <button onClick={() => updateQty(item.id, item.qty - 1)} className="micro-btn">-</button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(item.id, item.qty + 1)} className="micro-btn">+</button>
              <button onClick={() => removeItem(item.id)} className="micro-btn micro-btn--danger">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="coupon-row">
        <input
          placeholder="쿠폰코드 (SAVE10, SAVE20)"
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value)}
          className="input coupon-input"
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
function Panel({
  title,
  variant,
  children,
}: {
  title: string;
  variant: "counter" | "auth" | "cart";
  children: React.ReactNode;
}) {
  return (
    <div className={`panel panel--${variant}`}>
      <div className="panel-title">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="row">{children}</div>;
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
      className={`btn${variant === "ghost" ? " btn--ghost" : ""}`}
    >
      {children}
    </button>
  );
}
