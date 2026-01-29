import { sum } from '../src/sum';

describe('sum', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });

  test('adds 0 + 0 to equal 0', () => {
    expect(sum(0, 0)).toBe(0);
  });

  test('adds negative and positive numbers', () => {
    expect(sum(-5, 10)).toBe(5);
  });

  test('adds two negative numbers', () => {
    expect(sum(-3, -7)).toBe(-10);
  });

  test('adds floating point numbers', () => {
    expect(sum(0.1, 0.2)).toBeCloseTo(0.3);
  });
});