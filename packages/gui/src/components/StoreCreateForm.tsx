import { useState } from 'react'
import { useZuiStore } from '../store/zuiStore'

interface StoreCreateFormState {
    name: string;
    fields: {
        id: string;
        name: string;
        type: 'string' | 'number' | 'boolean'
    }[];
    color: string;
    registerToZui: boolean;
}

const INITIAL_FORM_STATE: StoreCreateFormState = {
    name: '',
    fields: [],
    color: 'amber',
    registerToZui: true
}

const COLOR_PALETTE = ['blue', 'green', 'amber', 'purple'] as const;
const VALID_NAME_PATTERN = /^[a-z0-9_-]+$/;

type StoreCreateFormProps = {
    send: (message: unknown) => void;
};

function StoreCreateForm({ send }: StoreCreateFormProps) {
    const [formState, setFormState] = useState<StoreCreateFormState>(INITIAL_FORM_STATE);
    const [lastSubmitted, setLastSubmitted] = useState<{ name: string; register: boolean } | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const stores = useZuiStore((s) => s.stores);
    const actionResult = useZuiStore((s) => s.actionResult);

    const addField = () => {
        setFormState({
            ...formState,
            fields: [...formState.fields, { id: crypto.randomUUID(), name: '', type: 'string' }],
        });
    };

    const updateField = (index: number, patch: Partial<StoreCreateFormState['fields'][number]>) => {
        setFormState({
            ...formState,
            fields: formState.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
        });
    };

    const removeField = (index: number) => {
        setFormState({
            ...formState,
            fields: formState.fields.filter((_, i) => i !== index),
        });
    };

    const createStore = () => {
        const name = formState.name.trim().toLowerCase();
        if (!name) return;

        if (!VALID_NAME_PATTERN.test(name)) {
            setValidationError('Store name can only contain lowercase letters, numbers, - and _.');
            return;
        }

        const isDuplicate = Object.keys(stores).some((existing) => existing.toLowerCase() === name);
        if (isDuplicate) {
            setValidationError('A store with this name already exists.');
            return;
        }

        setValidationError(null);
        send({
            type: 'SCAFFOLD_STORE',
            name,
            fields: formState.fields.map(({ name, type }) => ({ name, type })),
            register: formState.registerToZui,
            color: formState.color,
        });
        setLastSubmitted({ name, register: formState.registerToZui });
        setFormState(INITIAL_FORM_STATE);
    };

    const resultMessage =
        actionResult && lastSubmitted && actionResult.name === lastSubmitted.name
            ? actionResult.success
                ? lastSubmitted.register
                    ? 'Created and registered successfully.'
                    : 'File created — not visible in GUI yet. Add zui(...) to register it.'
                : actionResult.reason
            : null;

    return (
        <div>
            <input
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="Store name (e.g. productStore)"
            />

            <div>
                {formState.fields.map((field, index) => (
                    <div key={field.id}>
                        <input
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                            placeholder="Field name"
                        />
                        <select
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as StoreCreateFormState['fields'][number]['type'] })}
                        >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                        </select>
                        <button type="button" onClick={() => removeField(index)}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={addField}>Add field</button>
            </div>
            <div>
                {
                    COLOR_PALETTE.map((color) => (
                        <label key={color}>
                            <input type='radio' name='color' checked={formState.color === color} onChange={() => setFormState({ ...formState, color })} />
                            {color}
                        </label>
                    ))
                }
            </div>
            <label>
                <input type='checkbox' checked={formState.registerToZui} onChange={() => setFormState({ ...formState, registerToZui: !formState.registerToZui })} />
                Register to Z-UI
            </label>
            <button type="button" onClick={createStore}>Create</button>
            {validationError && <p>{validationError}</p>}
            {!validationError && resultMessage && <p>{resultMessage}</p>}
        </div>
    )
}

export default StoreCreateForm