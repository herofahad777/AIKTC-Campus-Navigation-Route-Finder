import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NodeEditorPanel } from './NodeEditorPanel';
import { NodeItem } from '../lib/graphViewerUtils';

describe('NodeEditorPanel Component', () => {
  const mockNode: NodeItem = {
    id: 'gate',
    name: 'Main Campus Gate',
    x: 0,
    y: 0,
    z: 25,
  };

  const mockAllNodes: NodeItem[] = [
    mockNode,
    { id: 'library', name: 'Library', x: -15, y: 0, z: 5 },
  ];

  const defaultProps = {
    selectedNode: mockNode,
    allNodes: mockAllNodes,
    edges: [{ from: 'gate', to: 'admin' }],
    hasUnsavedChanges: false,
    onUpdateNode: vi.fn().mockReturnValue({ success: true }),
    onUpdatePosition: vi.fn(),
    onNudge: vi.fn(),
    onSnapToGround: vi.fn(),
    onSnapToGrid: vi.fn(),
    onAddNode: vi.fn().mockReturnValue({ id: 'node_new', name: 'New Node', x: 0, y: 0, z: 0 }),
    onDuplicateNode: vi.fn(),
    onDeleteNode: vi.fn().mockReturnValue(true),
    onAddEdge: vi.fn().mockReturnValue({ success: true }),
    onDeleteEdge: vi.fn().mockReturnValue(true),
    onRevertNode: vi.fn(),
    onRevertAll: vi.fn(),
    onSaveToDisk: vi.fn().mockResolvedValue({ success: true }),
    onExportJson: vi.fn().mockReturnValue('[]'),
    onSelectNode: vi.fn(),
    snapToGrid: false,
    onToggleSnapToGrid: vi.fn(),
  };

  it('renders node name and ID inputs populated with selected node details', () => {
    render(<NodeEditorPanel {...defaultProps} />);

    const nameInput = screen.getByTestId('node-editor-name-input') as HTMLInputElement;
    const idInput = screen.getByTestId('node-editor-id-input') as HTMLInputElement;

    expect(nameInput.value).toBe('Main Campus Gate');
    expect(idInput.value).toBe('gate');
  });

  it('allows updating name and ID and submitting form', () => {
    render(<NodeEditorPanel {...defaultProps} />);

    const nameInput = screen.getByTestId('node-editor-name-input');
    const idInput = screen.getByTestId('node-editor-id-input');
    const applyBtn = screen.getByTestId('save-metadata-btn');

    fireEvent.change(nameInput, { target: { value: 'South Gate' } });
    fireEvent.change(idInput, { target: { value: 'south_gate' } });
    fireEvent.click(applyBtn);

    expect(defaultProps.onUpdateNode).toHaveBeenCalledWith(
      'gate',
      { name: 'South Gate', id: 'south_gate' },
      true
    );
  });

  it('warns when a duplicate ID is entered', () => {
    render(<NodeEditorPanel {...defaultProps} />);

    const idInput = screen.getByTestId('node-editor-id-input');
    fireEvent.change(idInput, { target: { value: 'library' } });

    expect(screen.getByText('Duplicate ID')).toBeInTheDocument();
    expect(screen.getByTestId('save-metadata-btn')).toBeDisabled();
  });

  it('calls onNudge when nudge buttons are clicked', () => {
    render(<NodeEditorPanel {...defaultProps} />);

    const plus5mBtns = screen.getAllByRole('button', { name: '+5m' });
    // First +5m is X axis
    fireEvent.click(plus5mBtns[0]);
    expect(defaultProps.onNudge).toHaveBeenCalledWith('gate', 'x', 5);
  });

  it('calls onSnapToGround when Ground button is clicked', () => {
    render(<NodeEditorPanel {...defaultProps} />);

    const groundBtn = screen.getByRole('button', { name: /Ground \(0m\)/i });
    fireEvent.click(groundBtn);

    expect(defaultProps.onSnapToGround).toHaveBeenCalledWith('gate');
  });

  it('calls onSaveToDisk when save button is clicked', async () => {
    render(<NodeEditorPanel {...defaultProps} />);

    const saveDiskBtn = screen.getByTestId('save-to-disk-btn');
    await fireEvent.click(saveDiskBtn);

    expect(defaultProps.onSaveToDisk).toHaveBeenCalled();
  });

  it('allows connecting a new edge to another node', () => {
    render(<NodeEditorPanel {...defaultProps} />);

    const select = screen.getByTestId('edge-target-select');
    const connectBtn = screen.getByTestId('add-edge-btn');

    fireEvent.change(select, { target: { value: 'library' } });
    fireEvent.click(connectBtn);

    expect(defaultProps.onAddEdge).toHaveBeenCalledWith('gate', 'library');
  });

  it('allows disconnecting an attached edge', () => {
    render(<NodeEditorPanel {...defaultProps} />);

    // Should list admin as an attached pathway
    const deleteBtn = screen.getByTestId('delete-edge-admin');
    fireEvent.click(deleteBtn);

    expect(defaultProps.onDeleteEdge).toHaveBeenCalledWith('gate', 'admin');
  });
});
