import { createUnitSystem } from '@lp-labs/unit-system';
const value: number = createUnitSystem([{ id: 'm', dimension: 'length', scale: 1 }]).convert(
  1,
  'm',
  'm',
);
void value;
