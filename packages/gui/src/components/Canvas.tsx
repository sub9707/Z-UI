import { useEffect } from 'react'
import { useZuiStore } from '../store/zuiStore';
import { ReactFlow, useNodesState, useEdgesState, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const storeNode = { storeNode: StoreNode };

function Canvas() {
    const stores = useZuiStore((s) => s.stores);
    const dependencyEdges = useZuiStore((s) => s.dependencyEdges);
    const [nodes, setNodes, onNodesChange] = useNodesState<{
        id: string;
        position: { x: number; y: number };
        type: string;
        data: { label: string; state: unknown; actions: string[] };
    }>([]);
    const [edges, setEdges] = useEdgesState<{ id: string; source: string; target: string }>([]);

    useEffect(() => {
        setNodes((currentNodes) => {
            const existingById = new Map(currentNodes.map((node) => [node.id, node]));
            return Object.entries(stores).map(([name, info], idx) => {
                const existing = existingById.get(name);
                return {
                    id: name,
                    position: existing?.position ?? { x: idx * 250, y: 100 },
                    type: 'storeNode',
                    data: { label: name, state: info.currentState, actions: info.actions },
                };
            });
        });
    }, [stores, setNodes]);

    useEffect(() => {
        setEdges(
            dependencyEdges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
            })),
        );
    }, [dependencyEdges, setEdges]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                nodeTypes={storeNode}
                onNodeClick={(_event, node) => useZuiStore.getState().selectStore(node.id)}
            />
        </div>
    )
}

export default Canvas


function StoreNode({ data }: { data: { label: string; state: unknown; actions: string[] } }) {
    const entries = Object.entries(data.state as object).filter(([, value]) => typeof value !== 'function');
    const preview = entries.slice(0, 3);
    const remaining = entries.length - preview.length;

    return (
        <div
            style={{
                width: 180,
                padding: 10,
                borderRadius: 6,
                border: '1px solid #444',
                background: '#1e1e1e',
                color: '#eee',
                fontSize: 12,
            }}
        >
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{data.label}</div>
            <div>
                {preview.map(([key, value]) => (
                    <div key={key}>{key}: {String(value)}</div>
                ))}
                {remaining > 0 && <div>외 {remaining}개</div>}
            </div>
            <div style={{ marginTop: 6, opacity: 0.7 }}>액션 {data.actions.length}개</div>
        </div>
    )
}