import assert from 'node:assert/strict';
import {
  clampDiagramZoom,
  clampInlineDiagramZoom,
  getWheelZoom,
} from '../src/diagram-controller.mjs';

assert.equal(clampDiagramZoom(0.1), 0.45);
assert.equal(clampDiagramZoom(4), 3);
assert.equal(clampInlineDiagramZoom(0.1), 0.35);
assert.equal(clampInlineDiagramZoom(4), 2.5);
assert.ok(getWheelZoom(1, -100) > 1);
assert.ok(getWheelZoom(1, 100) < 1);

console.log('diagram controller tests passed');
