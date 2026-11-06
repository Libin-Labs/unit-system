import {
  createUnitSystem,
  type Quantity,
  type UnitDefinition,
  type UnitSystem,
} from '@lp-labs/unit-system';
const definitions: UnitDefinition[] = [{ id: 'm', dimension: 'length', scale: 1 }];
const system: UnitSystem = createUnitSystem(definitions);
const quantity: Quantity = system.add(system.quantity(1, 'm'), system.quantity(2, 'm'));
// @ts-expect-error unit scales are numeric.
createUnitSystem([{ id: 'bad', dimension: 'x', scale: '1' }]);
void quantity;
