import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createUnitSystem } from '../dist/esm/index.js';
const units = [
  { id: 'm', dimension: 'length', scale: 1 },
  { id: 'km', dimension: 'length', scale: 1000 },
  { id: 'cm', dimension: 'length', scale: 0.01 },
  { id: 'ft', dimension: 'length', scale: 0.3048 },
  { id: 's', dimension: 'time', scale: 1 },
  { id: 'min', dimension: 'time', scale: 60 },
  { id: 'K', dimension: 'temperature', scale: 1 },
  { id: 'C', dimension: 'temperature', scale: 1, offset: 273.15 },
  { id: 'F', dimension: 'temperature', scale: 5 / 9, offset: 255.3722222222222 },
];
const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
test('converts compatible metric and customary length units', () => {
  const system = createUnitSystem(units);
  assert.equal(system.convert(1, 'km', 'm'), 1000);
  assert.equal(system.convert(100, 'cm', 'm'), 1);
  close(system.convert(1, 'ft', 'm'), 0.3048);
});
test('unknown units reject before arithmetic and known scale conversion is exact', () => {
  const system = createUnitSystem(units);
  assert.equal(system.convert(3, 'km', 'm'), 3000);
  assert.throws(() => system.convert(1, 'mile', 'm'), /Unknown unit/);
});
test('dimensions prevent invalid conversion and addition', () => {
  const system = createUnitSystem(units);
  assert.throws(() => system.convert(1, 'm', 's'), /Incompatible dimensions/);
  assert.throws(
    () => system.add(system.quantity(1, 'm'), system.quantity(1, 's')),
    /different dimensions/,
  );
  assert.throws(
    () => system.subtract(system.quantity(1, 'm'), system.quantity(1, 's')),
    /different dimensions/,
  );
});
test('affine temperature conversion uses canonical offsets', () => {
  const system = createUnitSystem(units);
  close(system.convert(0, 'C', 'K'), 273.15);
  close(system.convert(32, 'F', 'C'), 0);
  close(system.convert(100, 'C', 'F'), 212);
  assert.throws(() => system.add(system.quantity(20, 'C'), system.quantity(5, 'C')), /Affine/);
  assert.throws(() => system.subtract(system.quantity(20, 'C'), system.quantity(5, 'C')), /Affine/);
});
test('linear quantity addition and subtraction preserve the first unit', () => {
  const system = createUnitSystem(units);
  assert.deepEqual(system.add(system.quantity(2, 'km'), system.quantity(500, 'm')), {
    value: 2.5,
    unit: 'km',
  });
  assert.deepEqual(system.subtract(system.quantity(2, 'km'), system.quantity(500, 'm')), {
    value: 1.5,
    unit: 'km',
  });
});
test('unit definitions and catalogue results are copied', () => {
  const input = { id: 'x', dimension: 'length', scale: 2 },
    system = createUnitSystem([input]);
  input.scale = 20;
  const listed = system.units();
  listed[0].scale = 30;
  assert.equal(system.convert(1, 'x', 'x'), 1);
});
test('dimension listings are stable and unknown dimensions have empty results', () => {
  const system = createUnitSystem(units);
  assert.deepEqual(
    system.units('time').map((unit) => unit.id),
    ['s', 'min'],
  );
  assert.deepEqual(system.units('unknown'), []);
  assert.equal(system.units().length, units.length);
});
test('invalid input, duplicate IDs and invalid affine parameters fail explicitly', () => {
  assert.throws(() => createUnitSystem([{ id: 'x', dimension: '', scale: 1 }]), TypeError);
  assert.throws(() => createUnitSystem([{ id: 'x', dimension: 'd', scale: 0 }]), RangeError);
  assert.throws(() => createUnitSystem([{ id: 'x', dimension: 'd', scale: Infinity }]), TypeError);
  assert.throws(
    () => createUnitSystem([{ id: 'x', dimension: 'd', scale: 1, offset: NaN }]),
    TypeError,
  );
  assert.throws(() => createUnitSystem([units[0], units[0]]), /Duplicate/);
  assert.throws(
    () => createUnitSystem(Array(10_001).fill({ id: 'x', dimension: 'd', scale: 1 })),
    /Duplicate|capacity/,
  );
});
test('nonfinite arithmetic outputs and nonfinite values are rejected', () => {
  const system = createUnitSystem([{ id: 'huge', dimension: 'x', scale: Number.MAX_VALUE }]);
  assert.throws(() => system.convert(2, 'huge', 'huge'), RangeError);
  assert.throws(() => system.quantity(Infinity, 'huge'), TypeError);
  assert.throws(() => system.convert(NaN, 'huge', 'huge'), TypeError);
  assert.throws(() => system.add({ value: 1, unit: 'x' }, { value: 2, unit: 'x' }), /Unknown unit/);
});
test('generated conversions roundtrip through common dimensions', () => {
  const system = createUnitSystem(units);
  for (let i = 1; i < 1000; i++) {
    const value = i / 7;
    close(system.convert(system.convert(value, 'km', 'm'), 'm', 'km'), value, 1e-12);
    close(system.convert(system.convert(value, 'C', 'F'), 'F', 'C'), value, 1e-10);
  }
});
test('CommonJS exports independent unit systems', () => {
  const api = createRequire(import.meta.url)('../dist/cjs/index.js');
  assert.equal(
    api.createUnitSystem([{ id: 'a', dimension: 'd', scale: 1 }]).convert(3, 'a', 'a'),
    3,
  );
});
