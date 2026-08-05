import { useState } from "react";
import { useZuiStore } from "../store/zuiStore";

type StorePanelProps = {
  send: (message: unknown) => void;
};

const parseValue = (raw: string, original: unknown): unknown => {
  if (typeof original === "number") return Number(raw);
  if (typeof original === "boolean") return raw === "true";
  return raw;
};

function StorePanel({ send }: StorePanelProps) {
  const stores = useZuiStore((s) => s.stores);
  const selectedStore = useZuiStore((s) => s.selectedStore);
  const storesArray = Object.entries(stores);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const selectStoreHandler = (name: string) => {
    useZuiStore.getState().selectStore(name);
    setEditingField(null);
  };

  const startEdit = (fieldName: string, fieldValue: unknown) => {
    setEditingField(fieldName);
    setInputValue(String(fieldValue));
  };

  const submitEdit = (fieldName: string, originalValue: unknown) => {
    if (!selectedStore) return;
    const parsed = parseValue(inputValue, originalValue);
    send({
      type: "SET_STATE",
      name: selectedStore,
      newState: { [fieldName]: parsed },
    });
    setEditingField(null);
  };

  const resetStore = () => {
    if (!selectedStore) return;
    const snapshot = stores[selectedStore]?.initialState;
    send({ type: "RESTORE_SNAPSHOT", name: selectedStore, snapshot });
  };

  const deleteStoreHandler = () => {
    if (!selectedStore) return;
    const confirmed = window.confirm(
      `Delete ${selectedStore}? (moved to .zui-trash, recoverable)`,
    );
    if (!confirmed) return;
    send({ type: "DELETE_STORE", name: selectedStore });
  };

  const renderSelectedStore = () => {
    if (!selectedStore) return null;
    const selectedStoreSnapshot = stores[selectedStore];
    if (!selectedStoreSnapshot) return null;

    return (
      <div>
        {Object.entries(selectedStoreSnapshot.currentState as object).map(
          ([fieldName, fieldValue]) => {
            const isPrimitive = typeof fieldValue !== "object";

            return (
              <div key={fieldName}>
                {isPrimitive
                  ? `${fieldName}: ${String(fieldValue)}`
                  : `${fieldName}: ${JSON.stringify(fieldValue)}`}

                {isPrimitive &&
                  (editingField === fieldName ? (
                    <input
                      autoFocus
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          submitEdit(fieldName, fieldValue);
                      }}
                    />
                  ) : (
                    <button onClick={() => startEdit(fieldName, fieldValue)}>
                      Edit
                    </button>
                  ))}
              </div>
            );
          },
        )}
        <button onClick={resetStore}>Reset</button>
        <button onClick={deleteStoreHandler}>Delete</button>
      </div>
    );
  };

  return (
    <div>
      <div>
        Currently Selected Store:
        {renderSelectedStore()}
      </div>
      <div>
        {storesArray.map(([name]) => (
          <button key={name} onClick={() => selectStoreHandler(name)}>
            {" "}
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StorePanel;
