import { useState } from 'react'
import { useZuiStore } from '../store/zuiStore'
import { STORE_COLOR_PALETTE } from '../utils/colors'
import styles from './StoreCreateForm.module.css'
import swatchColors from '../styles/swatchColors.module.css'

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
        <div className={styles.form}>
            <input
                className={styles.input}
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="Store name (e.g. productStore)"
            />

            {formState.fields.map((field, index) => (
                <div className={styles.fieldRow} key={field.id}>
                    <input
                        className={styles.input}
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        placeholder="Field name"
                    />
                    <select
                        className={styles.select}
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as StoreCreateFormState['fields'][number]['type'] })}
                    >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                    </select>
                    <button type="button" className={styles.iconBtn} onClick={() => removeField(index)}>×</button>
                </div>
            ))}
            <button type="button" className={styles.addFieldBtn} onClick={addField}>+ Add field</button>

            <div className={styles.swatchRow}>
                {STORE_COLOR_PALETTE.map((color) => (
                    <button
                        key={color}
                        type="button"
                        aria-label={color}
                        className={`${styles.swatch} ${swatchColors[color]} ${formState.color === color ? styles.swatchSelected : ''}`}
                        onClick={() => setFormState({ ...formState, color })}
                    />
                ))}
            </div>

            <label className={styles.checkboxRow}>
                <input
                    className={styles.checkbox}
                    type="checkbox"
                    checked={formState.registerToZui}
                    onChange={() => setFormState({ ...formState, registerToZui: !formState.registerToZui })}
                />
                Register to Z-UI
            </label>

            <button type="button" className={styles.submitBtn} onClick={createStore}>Create store</button>
            {validationError && <p className={`${styles.message} ${styles.messageError}`}>{validationError}</p>}
            {!validationError && resultMessage && <p className={styles.message}>{resultMessage}</p>}
        </div>
    )
}

export default StoreCreateForm
