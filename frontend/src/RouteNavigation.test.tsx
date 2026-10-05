import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock Scene to avoid WebGL requirements in JSDOM
vi.mock('./components/Scene', () => ({
  Scene: ({
    routePath,
    sourceId,
    destinationId,
    activeNodeId,
  }: {
    routePath?: string[];
    sourceId?: string | null;
    destinationId?: string | null;
    activeNodeId?: string | null;
  }) => (
    <div data-testid="mock-3d-scene">
      <div data-testid="scene-source">{sourceId ?? 'none'}</div>
      <div data-testid="scene-destination">{destinationId ?? 'none'}</div>
      <div data-testid="scene-active-node">{activeNodeId ?? 'none'}</div>
      <div data-testid="scene-route-path">{routePath?.join(',') ?? ''}</div>
    </div>
  ),
}));

describe('Route Navigation & Animation Integration', () => {
  it('switches to Route Finder tab and displays source and destination selectors', () => {
    render(<App />);

    const routeTabBtn = screen.getByRole('button', { name: /Route Finder/i });
    fireEvent.click(routeTabBtn);

    expect(screen.getByTestId('route-source-select')).toBeInTheDocument();
    expect(screen.getByTestId('route-dest-select')).toBeInTheDocument();
    expect(screen.getByTestId('find-route-btn')).toBeInTheDocument();
  });

  it('selects source and destination and queries the engine for a route', async () => {
    render(<App />);

    // Switch to Route Finder tab
    fireEvent.click(screen.getByRole('button', { name: /Route Finder/i }));

    const sourceSelect = screen.getByTestId('route-source-select');
    const destSelect = screen.getByTestId('route-dest-select');

    // Select Gate -> Library
    fireEvent.change(sourceSelect, { target: { value: 'gate' } });
    fireEvent.change(destSelect, { target: { value: 'library' } });

    // Click Find Route
    const findBtn = screen.getByTestId('find-route-btn');
    fireEvent.click(findBtn);

    // Wait for route result to display
    await waitFor(() => {
      expect(screen.getByText(/Engine Path Returned/i)).toBeInTheDocument();
    });

    expect(screen.getByText('1 HOPS')).toBeInTheDocument();
    expect(screen.getByText('1 Hops')).toBeInTheDocument();
    expect(screen.getByText('2 Nodes')).toBeInTheDocument();
    expect(screen.getByText(/Sequential Animation/i)).toBeInTheDocument();

    // Scene should receive the route path
    const sceneRoute = screen.getByTestId('scene-route-path');
    expect(sceneRoute.textContent).toBe('gate,library');
  });

  it('provides route_request.json export and route_result.json import workflow buttons', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Route Finder/i }));

    expect(screen.getByRole('button', { name: /Export route_request\.json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import route_result\.json/i })).toBeInTheDocument();
  });

  it('displays prominent C engine demo warning banner when routefinder.c is uncompiled', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Route Finder/i }));

    const warningBanner = screen.getByTestId('engine-demo-warning');
    expect(warningBanner).toBeInTheDocument();
    expect(warningBanner.textContent).toContain('DEMO MODE: engine/routefinder.c is Not Compiled');
    expect(warningBanner.textContent).toContain('SIMULATION');
  });

  it('swaps source and destination when swap button is clicked', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Route Finder/i }));

    const sourceSelect = screen.getByTestId('route-source-select') as HTMLSelectElement;
    const destSelect = screen.getByTestId('route-dest-select') as HTMLSelectElement;

    fireEvent.change(sourceSelect, { target: { value: 'gate' } });
    fireEvent.change(destSelect, { target: { value: 'admin' } });

    expect(sourceSelect.value).toBe('gate');
    expect(destSelect.value).toBe('admin');

    // Click swap
    const swapBtn = screen.getByTitle(/Swap source and destination/i);
    fireEvent.click(swapBtn);

    expect(sourceSelect.value).toBe('admin');
    expect(destSelect.value).toBe('gate');
  });

  it('allows quick-setting origin and destination from selected node inspector', () => {
    render(<App />);

    // Select Library in node list
    fireEvent.click(screen.getByTestId('node-item-library'));

    // Click "Set as Start" in inspector
    const setStartBtn = screen.getByRole('button', { name: /Set as Start/i });
    fireEvent.click(setStartBtn);

    // Should switch to route tab and update source
    const sourceSelect = screen.getByTestId('route-source-select') as HTMLSelectElement;
    expect(sourceSelect.value).toBe('library');

    // Switch back to locations and select CS Dept
    fireEvent.click(screen.getByRole('button', { name: /Locations/i }));
    fireEvent.click(screen.getByTestId('node-item-cs_dept'));

    // Click "Set as Dest" in inspector
    const setDestBtn = screen.getByRole('button', { name: /Set as Dest/i });
    fireEvent.click(setDestBtn);

    const destSelect = screen.getByTestId('route-dest-select') as HTMLSelectElement;
    expect(destSelect.value).toBe('cs_dept');
  });

  it('clears active route and resets state when Clear Route is clicked', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Route Finder/i }));
    fireEvent.change(screen.getByTestId('route-source-select'), { target: { value: 'gate' } });
    fireEvent.change(screen.getByTestId('route-dest-select'), { target: { value: 'library' } });
    fireEvent.click(screen.getByTestId('find-route-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Engine Path Returned/i)).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /Clear Route/i });
    fireEvent.click(clearBtn);

    expect(screen.queryByText(/Engine Path Returned/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('scene-route-path').textContent).toBe('');
  });
});
