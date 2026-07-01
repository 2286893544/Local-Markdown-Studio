export function clampDiagramZoom(value) {
  return Math.min(Math.max(Number(value) || 1, 0.45), 3);
}

export function clampInlineDiagramZoom(value) {
  return Math.min(Math.max(Number(value) || 1, 0.35), 2.5);
}

export function getWheelZoom(currentZoom, deltaY) {
  return currentZoom * Math.exp(-deltaY * 0.002);
}

export function createDiagramController({ elements, state }) {
  function openDiagramViewer(diagram) {
    const source = diagram.querySelector('.diagram-stage') || diagram.querySelector('svg');
    if (!source) return;

    elements.diagramViewerCanvas.innerHTML = '';
    elements.diagramViewerCanvas.append(source.cloneNode(true));
    setDiagramZoom(1);
    elements.diagramViewer.classList.add('is-visible');
    elements.diagramViewer.setAttribute('aria-hidden', 'false');
    elements.diagramViewerClose.focus();
  }

  function closeDiagramViewer() {
    if (!elements.diagramViewer.classList.contains('is-visible')) return;

    elements.diagramViewer.classList.remove('is-visible');
    elements.diagramViewer.setAttribute('aria-hidden', 'true');
    elements.diagramViewerCanvas.innerHTML = '';
    setDiagramZoom(1);
  }

  function zoomDiagram(delta) {
    setDiagramZoom(state.diagramZoom + delta);
  }

  function setDiagramZoom(value) {
    state.diagramZoom = clampDiagramZoom(value);
    const percent = Math.round(state.diagramZoom * 100);

    applyDiagramZoom(elements.diagramViewerCanvas, state.diagramZoom);
    centerDiagramScroll(elements.diagramViewerCanvas);
    elements.diagramZoomLevel.textContent = `${percent}%`;
  }

  function handleDiagramAction(button) {
    const diagram = button.closest('.diagram-flowchart');
    if (!diagram) return;

    const action = button.dataset.diagramAction;
    if (action === 'open') {
      openDiagramViewer(diagram);
      return;
    }

    if (action === 'zoom-in') zoomInlineDiagram(diagram, 0.15);
    if (action === 'zoom-out') zoomInlineDiagram(diagram, -0.15);
    if (action === 'zoom-reset') setInlineDiagramZoom(diagram, 1);
  }

  function zoomInlineDiagram(diagram, delta) {
    setInlineDiagramZoom(diagram, Number(diagram.dataset.zoom || 1) + delta);
  }

  function handleDiagramWheel(event, container, isViewer) {
    if (!(event.ctrlKey || event.metaKey)) return;

    event.preventDefault();
    const currentZoom = isViewer ? state.diagramZoom : Number(container.dataset.zoom || 1);
    const nextZoom = getWheelZoom(currentZoom, event.deltaY);

    cancelAnimationFrame(state.pendingDiagramZoomFrame);
    state.pendingDiagramZoomFrame = requestAnimationFrame(() => {
      if (isViewer) {
        setDiagramZoom(nextZoom);
        return;
      }
      setInlineDiagramZoom(container, nextZoom);
    });
  }

  function setInlineDiagramZoom(diagram, value) {
    const zoom = clampInlineDiagramZoom(value);
    const percent = Math.round(zoom * 100);
    const label = diagram.querySelector('[data-diagram-zoom]');

    diagram.dataset.zoom = String(zoom);
    applyDiagramZoom(diagram, zoom);
    centerDiagramScroll(diagram);
    if (label) label.textContent = `${percent}%`;
  }

  function fitDiagramsToContainers() {
    requestAnimationFrame(() => {
      elements.preview.querySelectorAll('.diagram-flowchart').forEach(fitDiagramToContainer);
    });
  }

  function fitDiagramToContainer(diagram) {
    const stage = diagram.querySelector('.diagram-stage');
    if (!stage) return;

    const baseWidth = Number(stage.dataset.baseWidth) || 0;
    if (!baseWidth) return;

    const styles = getComputedStyle(diagram);
    const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    const availableWidth = Math.max(1, diagram.clientWidth - horizontalPadding);
    const zoom = Math.min(1, Math.max(0.35, availableWidth / baseWidth));
    setInlineDiagramZoom(diagram, zoom);
  }

  return {
    closeDiagramViewer,
    fitDiagramsToContainers,
    handleDiagramAction,
    handleDiagramWheel,
    openDiagramViewer,
    setDiagramZoom,
    zoomDiagram,
  };
}

function applyDiagramZoom(container, zoom) {
  const stage = container.querySelector('.diagram-stage');
  const svg = container.querySelector('svg');
  if (!stage || !svg) return;

  const baseWidth = Number(stage.dataset.baseWidth) || Number(svg.getAttribute('width')) || 960;
  const baseHeight = Number(stage.dataset.baseHeight) || Number(svg.getAttribute('height')) || 560;
  stage.style.setProperty('--diagram-zoom', String(zoom));
  stage.style.width = `${Math.ceil(baseWidth * zoom)}px`;
  stage.style.height = `${Math.ceil(baseHeight * zoom)}px`;
}

function centerDiagramScroll(container) {
  const extraWidth = container.scrollWidth - container.clientWidth;
  if (extraWidth > 0) {
    container.scrollLeft = extraWidth / 2;
  }
}
