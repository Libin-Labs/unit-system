export interface UnitDefinition {
  id: string;
  dimension: string;
  scale: number;
  offset?: number;
}
export interface Quantity {
  value: number;
  unit: string;
}
export interface UnitSystem {
  convert(value: number, from: string, to: string): number;
  quantity(value: number, unit: string): Quantity;
  add(first: Quantity, second: Quantity): Quantity;
  subtract(first: Quantity, second: Quantity): Quantity;
  units(dimension?: string): UnitDefinition[];
}
interface NormalizedUnit {
  id: string;
  dimension: string;
  scale: number;
  offset: number;
}
function label(value: string, name: string): void {
  if (typeof value !== 'string' || !value || value.length > 128)
    throw new TypeError(`${name} must be a nonempty string up to 128 units.`);
}
function finite(value: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError(`${name} must be finite.`);
}
export function createUnitSystem(input: Iterable<UnitDefinition>): UnitSystem {
  if (input == null || typeof input[Symbol.iterator] !== 'function')
    throw new TypeError('Units must be iterable.');
  const definitions = new Map<string, NormalizedUnit>();
  for (const unit of input) {
    label(unit.id, 'Unit ID');
    label(unit.dimension, 'Dimension');
    finite(unit.scale, 'Scale');
    finite(unit.offset ?? 0, 'Offset');
    if (unit.scale <= 0) throw new RangeError('Unit scale must be positive.');
    if (definitions.size === 10_000) throw new RangeError('Unit capacity exceeded.');
    if (definitions.has(unit.id)) throw new TypeError(`Duplicate unit: ${unit.id}`);
    definitions.set(unit.id, {
      id: unit.id,
      dimension: unit.dimension,
      scale: unit.scale,
      offset: unit.offset ?? 0,
    });
  }
  const get = (id: string) => {
    const unit = definitions.get(id);
    if (!unit) throw new TypeError(`Unknown unit: ${id}`);
    return unit;
  };
  const canonical = (value: number, unit: NormalizedUnit) => {
    const result = value * unit.scale + unit.offset;
    if (!Number.isFinite(result)) throw new RangeError('Canonical quantity exceeds numeric range.');
    return result;
  };
  const fromCanonical = (value: number, unit: NormalizedUnit) => {
    const result = (value - unit.offset) / unit.scale;
    if (!Number.isFinite(result)) throw new RangeError('Converted quantity exceeds numeric range.');
    return result;
  };
  const coerce = (quantity: Quantity) => {
    if (!quantity || typeof quantity !== 'object') throw new TypeError('Expected a quantity.');
    finite(quantity.value, 'Quantity value');
    const unit = get(quantity.unit);
    return { unit, value: canonical(quantity.value, unit) };
  };
  return {
    convert(value, from, to) {
      finite(value, 'Value');
      const source = get(from),
        target = get(to);
      if (source.dimension !== target.dimension)
        throw new TypeError(
          `Incompatible dimensions: ${source.dimension} and ${target.dimension}.`,
        );
      return fromCanonical(canonical(value, source), target);
    },
    quantity(value, unit) {
      finite(value, 'Value');
      get(unit);
      return Object.freeze({ value, unit });
    },
    add(first, second) {
      const a = coerce(first),
        b = coerce(second);
      if (a.unit.dimension !== b.unit.dimension)
        throw new TypeError('Cannot add quantities with different dimensions.');
      if (a.unit.offset !== 0 || b.unit.offset !== 0)
        throw new TypeError('Affine units cannot be added as absolute quantities.');
      return Object.freeze({ value: fromCanonical(a.value + b.value, a.unit), unit: a.unit.id });
    },
    subtract(first, second) {
      const a = coerce(first),
        b = coerce(second);
      if (a.unit.dimension !== b.unit.dimension)
        throw new TypeError('Cannot subtract quantities with different dimensions.');
      if (a.unit.offset !== 0 || b.unit.offset !== 0)
        throw new TypeError('Affine units cannot be subtracted as absolute quantities.');
      return Object.freeze({ value: fromCanonical(a.value - b.value, a.unit), unit: a.unit.id });
    },
    units(dimension) {
      if (dimension !== undefined) label(dimension, 'Dimension');
      return [...definitions.values()]
        .filter((unit) => dimension === undefined || unit.dimension === dimension)
        .map(({ id, dimension: unitDimension, scale, offset }) =>
          offset === 0
            ? { id, dimension: unitDimension, scale }
            : { id, dimension: unitDimension, scale, offset },
        );
    },
  };
}
