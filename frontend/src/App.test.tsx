import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock the Scene 3D component so WebGL rendering does not require a GPU context in JSDOM
vi.mock('./components/Scene', () => ({
  Scene: ({
    nodes,
    selectedNode,
    onSelectNode,
    debugMode,
  }: {
    nodes: Array<{ id: string; name: string }>;
    selectedNode: { id: string; name: string } | null;
    onSelectNode: (node: { id: string; name: string }) => void;
    debugMode: boolean;
  }) => (
    <div data-testid="mock-3d-scene" data-debug={debugMode}>
      <div>3D Viewer Mock</div>
      <div>Selected: {selectedNode?.name ?? 'None'}</div>
      {nodes.map((n) => (
        <button key={n.id} onClick={() => onSelectNode(n)}>
          SceneNode-{n.id}
        </button>
      ))}
    </div>
  ),
}));

describe('App - 3D Graph Viewer 3-Panel Layout', () => {
  it('renders application header and title', () => {
    render(<App />);
    expect(screen.getByText('Campus Navigation Route Finder')).toBeInTheDocument();
    expect(screen.getByText(/3D Graph Viewer/i)).toBeInTheDocument();
  });

  it('renders the left panel with node and edge counts', () => {
    render(<App />);
    // Check metric labels
    expect(screen.getByText('Nodes')).toBeInTheDocument();
    expect(screen.getByText('Edges')).toBeInTheDocument();
    // Check presence of campus nodes in the list
    expect(screen.getByTestId('node-item-gate')).toBeInTheDocument();
    expect(screen.getByTestId('node-item-library')).toBeInTheDocument();
  });

  it('renders the 3D scene in the center panel', () => {
    render(<App />);
    expect(screen.getByTestId('mock-3d-scene')).toBeInTheDocument();
  });

  it('allows selecting a node from the list and displays coordinates in the inspector', () => {
    render(<App />);
    const gateBtn = screen.getByTestId('node-item-gate');
    fireEvent.click(gateBtn);

    // Inspector should now show Main Campus Gate details
    expect(screen.getByText('ID: gate')).toBeInTheDocument();
    expect(screen.getByText('Spatial Coordinates')).toBeInTheDocument();
    // Gate has z > 0 (South)
    expect(screen.getByText(/\dm South/i)).toBeInTheDocument();
  });

  it('toggles Debug Placement Mode', () => {
    render(<App />);
    const debugToggle = screen.getByTitle(/Toggle Debug Placement Mode/i);
    expect(screen.getByText(/Debug Placement ON/i)).toBeInTheDocument();

    fireEvent.click(debugToggle);
    expect(screen.getByText(/Debug Placement OFF/i)).toBeInTheDocument();

    fireEvent.click(debugToggle);
    expect(screen.getByText(/Debug Placement ON/i)).toBeInTheDocument();
  });

  it('renders Data Validation section with clean status for valid default data', () => {
    render(<App />);
    expect(screen.getByText('Data Validation')).toBeInTheDocument();
    expect(screen.getByText(/All nodes and edge endpoints passed data validation/i)).toBeInTheDocument();
  });

  it('filters campus node list via search input', () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText(/Search campus nodes/i);

    fireEvent.change(searchInput, { target: { value: 'Auditorium' } });
    expect(screen.getByText('Main Auditorium')).toBeInTheDocument();
    expect(screen.queryByText('Engineering Quadrangle')).not.toBeInTheDocument();
  });
});
