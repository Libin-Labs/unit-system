# @lp-labs/unit-system

Dimension-checked conversions and linear quantity arithmetic using explicit unit definitions.
Supports affine conversion offsets without silently applying invalid absolute-temperature sums.
Independent implementation with zero runtime or peer dependencies.

## Install

```bash
npm install @lp-labs/unit-system
```

ES2022 ESM/CommonJS and TypeScript declarations.
CommonJS: `const { createUnitSystem } = require('@lp-labs/unit-system')`.

## Quickstart

```js
import { createUnitSystem } from '@lp-labs/unit-system';

const units = createUnitSystem([
  { id: 'm', dimension: 'length', scale: 1 },
  { id: 'km', dimension: 'length', scale: 1000 },
  { id: 'cm', dimension: 'length', scale: 0.01 },
  { id: 'C', dimension: 'temperature', scale: 1, offset: 273.15 },
  { id: 'F', dimension: 'temperature', scale: 5 / 9, offset: 255.3722222222222 },
]);
if (units.convert(2, 'km', 'm') !== 2000) throw new Error('Length conversion failed');
if (Math.abs(units.convert(32, 'F', 'C')) > 1e-10) throw new Error('Temperature conversion failed');
```

## Unit definitions and conversion

`createUnitSystem(units: Iterable<UnitDefinition>): UnitSystem`

Each unit has a unique `id`, a `dimension` label, positive finite `scale` and optional finite
`offset` (defaults to zero). IDs/dimensions are nonempty strings up to 128 units.
Up to 10000 units are accepted. Definitions are copied; `units(dimension?)` returns detached
entries. Equal dimension labels are the compatibility contract.

Canonical value is `value * scale + offset`; conversion to another compatible unit is
`(canonical - target.offset) / target.scale`. You choose each dimension's canonical reference,
scale and offset consistently. There is no global registry or implicit knowledge of unit symbols.

For example, Kelvin canonical temperature uses `C` scale 1, offset 273.15 and
`F` scale 5/9, offset 255.3722222222222.
For length, use meters canonical: kilometer scale 1000 and centimeter scale 0.01.

```js
import { createUnitSystem } from '@lp-labs/unit-system';

const units = createUnitSystem([
  { id: 'm', dimension: 'length', scale: 1 },
  { id: 'ft', dimension: 'length', scale: 0.3048 },
]);
const total = units.add(units.quantity(1, 'm'), units.quantity(1, 'ft'));
if (Math.abs(total.value - 1.3048) > 1e-12 || total.unit !== 'm') {
  throw new Error('Dimensioned addition failed');
}
```

## Quantities and errors

- `convert(value, from, to)` validates finite numeric values and exact dimension equality.
- `quantity(value, unit)` returns a frozen `{ value, unit }`.
- `add(first, second)` and `subtract(first, second)` convert the second quantity to the first
  unit's canonical basis, then return a frozen result in the first unit.
- Addition/subtraction reject **any** unit with a nonzero offset. Absolute affine quantities,
  including temperatures, require application-specific delta semantics; use `convert()` for them.
- `units()` returns all definitions in insertion order; `units(dimension)` filters exact dimension.

Unknown units/wrong dimensions/nonfinite inputs throw `TypeError`; nonpositive scales or
nonfinite derived arithmetic throw `RangeError`. No conversions are guessed or coerced.

## Performance and scope

Unit lookup/conversion/linear arithmetic are average O(1); listing costs O(U).
The only numeric model is JavaScript `number`, with its floating-point precision and overflow.
No compound units, dimensional exponent algebra, prefixes, conversion graph inference, physical
constants database, significant figures, uncertainty propagation or exact rational arithmetic
is included. Treat unit IDs/dimension labels as application-level contracts.

Exported types: `UnitDefinition`, `Quantity`, `UnitSystem`.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
