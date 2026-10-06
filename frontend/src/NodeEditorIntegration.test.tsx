import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock Scene to avoid WebGL / Canvas in JSDOM
vi.mock('./components/Scene', () => ({
  Scene: ({
    nodes,
    selectedNode,
    onSelectNode,
    onUpdateNodePosition,
  }: {
    nodes: Array<{ id: string; name: string; x: number; y: number; z: number }>;
    selectedNode: { id: string; name: string } | null;
    onSelectNode: (node: { id: string; name: string } | null) => void;
    onUpdateNodePosition?: (id: string, x: number, y: number, z: number) => void;
  }) => (
    <div data-testid="mock-3d-scene">
      <div data-testid="scene-selected">{selectedNode?.id ?? 'none'}</div>
      {nodes.map((n) => (
        <button
          key={n.id}
          data-testid={`scene-node-${n.id}`}
          onClick={() => onSelectNode(n)}
        >
          {n.name}
        </button>
      ))}
      {selectedNode && onUpdateNodePosition && (
        <button
          data-testid="mock-drag-gizmo-x"
          onClick={() => onUpdateNodePosition(selectedNode.id, 99, 0, 99)}
        >
          Drag Gizmo
        </button>
      )}
    </div>
  ),
}));

describe('Node Editor In-Browser Integration', () => {
  it('switches to Node Editor tab in Debug Mode and displays editor controls', () => {
    render(<App />);

    // Node Editor tab is present when Debug Mode is ON
    const editorTabBtn = screen.getByTestId('right-tab-editor');
    expect(editorTabBtn).toBeInTheDocument();

    fireEvent.click(editorTabBtn);

    // Node Editor controls should be visible
    expect(screen.getByTestId('node-editor-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('node-editor-id-input')).toBeInTheDocument();
    expect(screen.getByTestId('save-metadata-btn')).toBeInTheDocument();
    expect(screen.getByTestId('save-to-disk-btn')).toBeInTheDocument();
  });

  it('allows renaming a node and updates both sidebar and 3D scene list', () => {
    render(<App />);

    // Switch to editor
    fireEvent.click(screen.getByTestId('right-tab-editor'));

    const nameInput = screen.getByTestId('node-editor-name-input');
    const applyBtn = screen.getByTestId('save-metadata-btn');

    fireEvent.change(nameInput, { target: { value: 'Super Library 2026' } });
    fireEvent.click(applyBtn);

    // Scene and sidebar should show updated node name
    expect(screen.getAllByText('Super Library 2026').length).toBeGreaterThanOrEqual(1);
  });

  it('updates node position when 3D transform gizmo triggers drag update', () => {
    render(<App />);

    // Click mock gizmo drag
    const dragBtn = screen.getByTestId('mock-drag-gizmo-x');
    fireEvent.click(dragBtn);

    // Switch to editor and verify coordinate inputs
    fireEvent.click(screen.getByTestId('right-tab-editor'));
    const inputs99 = screen.getAllByDisplayValue('99');
    expect(inputs99.length).toBeGreaterThanOrEqual(1);
  });

  it('adds a new node and selects it in the editor', () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('right-tab-editor'));

    const addBtn = screen.getByTestId('add-node-btn');
    fireEvent.click(addBtn);

    // A new node should be selected
    const idInput = screen.getByTestId('node-editor-id-input') as HTMLInputElement;
    expect(idInput.value).toContain('node_');
  });

  it('allows creating an edge between nodes in the editor', () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('right-tab-editor'));

    const edgeSelect = screen.getByTestId('edge-target-select');
    const connectBtn = screen.getByTestId('add-edge-btn');

    // Select auditorium to connect to library (which is selected)
    fireEvent.change(edgeSelect, { target: { value: 'auditorium' } });
    fireEvent.click(connectBtn);

    // Pathway should now be listed in attached pathways
    expect(screen.getByTestId('delete-edge-auditorium')).toBeInTheDocument();
  });
});
