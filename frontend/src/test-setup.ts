import '@testing-library/jest-dom/vitest';

// JSDOM does not provide WebGL context by default, so we mock basic canvas getContext
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextType: string) {
    if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') {
      return {
        canvas: this,
        getExtension: () => null,
        getParameter: () => 0,
        createTexture: () => ({}),
        bindTexture: () => {},
        texParameteri: () => {},
        texImage2D: () => {},
        clearColor: () => {},
        clearDepth: () => {},
        clear: () => {},
        enable: () => {},
        disable: () => {},
        viewport: () => {},
        drawArrays: () => {},
        drawElements: () => {},
      };
    }
    return null;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

// Mock ResizeObserver for JSDOM
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
