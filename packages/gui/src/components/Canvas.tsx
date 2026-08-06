import { useEffect, useRef, type CSSProperties } from 'react'
import { useZuiStore } from '../store/zuiStore';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    useReactFlow,
    Handle,
    Position,
    Background,
    BackgroundVariant,
    Controls,
    Panel,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styles from './Canvas.module.css';
import { resolveStoreColor } from '../utils/colors';

const storeNode = { storeNode: StoreNode };

function Canvas() {
    const stores = useZuiStore((s) => s.stores);
    const dependencyEdges = useZuiStore((s) => s.dependencyEdges);
    const selectedStore = useZuiStore((s) => s.selectedStore);
    const [nodes, setNodes, onNodesChange] = useNodesState<{
        id: string;
        position: { x: number; y: number };
        type: string;
        selected: boolean;
        measured?: { width?: number; height?: number };
        data: { label: string; state: unknown; actions: string[]; color?: string | undefined };
    }>([]);
    const draggedNodeIds = useRef<Set<string>>(new Set());
    const [edges, setEdges] = useEdgesState<{
        id: string;
        source: string;
        target: string;
        markerEnd: { type: MarkerType; color: string };
        style: { stroke: string };
    }>([]);

    useEffect(() => {
        setNodes((currentNodes) => {
            const existingById = new Map(currentNodes.map((node) => [node.id, node]));
            return Object.entries(stores).map(([name, info]) => {
                const existing = existingById.get(name);
                return {
                    id: name,
                    position: existing?.position ?? { x: 0, y: 120 },
                    type: 'storeNode',
                    selected: name === selectedStore,
                    data: { label: name, state: info.currentState, actions: info.actions, color: info.color },
                };
            });
        });
    }, [stores, selectedStore, setNodes]);

    // 드래그로 옮기지 않은 노드들은 실제 렌더링된 너비(node.measured)를 기준으로
    // 왼쪽부터 자동으로 나란히 배치한다 — 겹치지 않게 폭에 맞춰 스스로 재정렬됨.
    useEffect(() => {
        const GAP = 24;
        const FALLBACK_WIDTH = 190;
        let cursorX = 0;
        let changed = false;

        const next = nodes.map((node) => {
            if (draggedNodeIds.current.has(node.id)) return node;

            const width = node.measured?.width ?? FALLBACK_WIDTH;
            const x = cursorX;
            cursorX += width + GAP;

            if (node.position.x === x) return node;
            changed = true;
            return { ...node, position: { ...node.position, x } };
        });

        if (changed) setNodes(next);
    }, [nodes, setNodes]);

    useEffect(() => {
        setEdges(
            dependencyEdges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-primary)' },
                style: { stroke: 'var(--color-primary)' },
            })),
        );
    }, [dependencyEdges, setEdges]);

    return (
        <div className={styles.wrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                nodeTypes={storeNode}
                onNodeClick={(_event, node) => useZuiStore.getState().selectStore(node.id)}
                onNodeDragStop={(_event, node) => draggedNodeIds.current.add(node.id)}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-default)" />
                <Controls showInteractive={false} showFitView={false} />
                <FitViewOnStoresChange storeCount={Object.keys(stores).length} />
                <RecenterButton />
            </ReactFlow>
        </div>
    )
}

export default Canvas


function FitViewOnStoresChange({ storeCount }: { storeCount: number }) {
    const { fitView } = useReactFlow();

    useEffect(() => {
        if (storeCount > 0) fitView({ duration: 600, padding: 0.2 });
    }, [storeCount, fitView]);

    return null;
}

function RecenterButton() {
    const { fitView } = useReactFlow();

    return (
        <Panel position="bottom-right">
            <button
                type="button"
                className={styles.recenterBtn}
                title="Center on stores"
                onClick={() => fitView({ duration: 500, padding: 0.2 })}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                </svg>
            </button>
        </Panel>
    );
}

const summarizeShape = (value: unknown): string => {
    const keys = Object.keys(value as object);
    const preview = keys.slice(0, 4).join(', ');
    return keys.length > 4 ? `{ ${preview}, … }` : `{ ${preview} }`;
};

const summarizeValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'Array(0)';
        const first = value[0];
        // 배열 원소가 다 같은 모양(객체)이라고 가정하고, 항목마다 반복하지 않고 개수 + 첫 항목 구조만 보여준다.
        if (first !== null && typeof first === 'object' && !Array.isArray(first)) {
            return `Array(${value.length}) · ${summarizeShape(first)}`;
        }
        const preview = value.slice(0, 3).map((item) => summarizeValue(item)).join(', ');
        return value.length > 3 ? `[ ${preview}, … ]` : `[ ${preview} ]`;
    }
    if (typeof value === 'object') return summarizeShape(value);
    return String(value);
};

function StoreNode({ data, selected }: { data: { label: string; state: unknown; actions: string[]; color?: string }; selected: boolean }) {
    const entries = Object.entries(data.state as object).filter(([, value]) => typeof value !== 'function');
    const preview = entries.slice(0, 3);
    const remaining = entries.length - preview.length;
    const storeColor = resolveStoreColor(data.color);

    return (
        <div
            className={`${styles.node} ${selected ? styles.nodeSelected : ''}`}
            style={{ '--node-color': storeColor } as CSSProperties}
        >
            <Handle className={styles.handle} type="target" position={Position.Left} />
            <Handle className={styles.handle} type="source" position={Position.Right} />
            <div className={styles.nodeHeader}>
                <span className={styles.nodeDot} />
                {data.label}
            </div>
            <div className={styles.nodeFields}>
                {preview.map(([key, value]) => (
                    <div className={styles.nodeFieldRow} key={key}>
                        {key}: <span>{summarizeValue(value)}</span>
                    </div>
                ))}
                {remaining > 0 && <div className={styles.nodeMore}>+{remaining} more</div>}
            </div>
            <div className={styles.nodeFooter}>{data.actions.length} actions</div>
        </div>
    )
}
