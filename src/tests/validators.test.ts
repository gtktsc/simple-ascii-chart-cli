import {
  validateAxisCenter,
  validateColors,
  validateYRange,
  validateThresholds,
  validateLegend,
  validateFormatter,
  validateLineFormatter,
  validateSymbols,
} from '../validators';
import { Legend, Formatter, Symbols, FormatterHelpers } from 'simple-ascii-chart';

describe('Utility Functions Tests', () => {
  describe('validateAxisCenter', () => {
    it('returns valid MaybePoint when given two numbers', () => {
      expect(validateAxisCenter([1, 2])).toEqual([1, 2]);
    });

    it('returns undefined for invalid input', () => {
      expect(validateAxisCenter([1])).toBeUndefined();
      expect(validateAxisCenter(['a', 'b'])).toBeUndefined();
    });
  });

  describe('validateColors', () => {
    it('filters valid ANSI colors from an array', () => {
      expect(validateColors(['ansiRed', 'ansiGreen', 'ansiBlue'])).toEqual([
        'ansiRed',
        'ansiGreen',
        'ansiBlue',
      ]);
    });

    it('returns undefined for unsupported color strings', () => {
      expect(validateColors(['red', 'green'])).toBeUndefined();
    });

    it('returns a single ANSI color if input is a valid ANSI color string', () => {
      expect(validateColors('ansiRed')).toEqual('ansiRed');
    });
  });

  describe('validateYRange', () => {
    it('returns a valid [number, number] tuple for valid input', () => {
      expect(validateYRange([10, 20])).toEqual([10, 20]);
    });

    it('returns undefined for invalid ranges', () => {
      expect(validateYRange([10])).toBeUndefined();
      expect(validateYRange(['a', 'b'])).toBeUndefined();
    });
  });

  describe('validateThresholds', () => {
    it('returns a valid array of Thresholds when given correct input', () => {
      expect(validateThresholds([{ x: 10, y: 20, color: 'ansiRed' }])).toEqual([
        { x: 10, y: 20, color: 'ansiRed' },
      ]);
    });

    it('ignores invalid items in the array', () => {
      expect(
        validateThresholds([
          { x: 10, y: 20, color: 'ansiRed' },
          { x: 'a', y: 'b' },
        ]),
      ).toEqual([{ x: 10, y: 20, color: 'ansiRed' }]);
    });
  });

  describe('validateLegend', () => {
    it('returns a valid Legend object for correct JSON string input', () => {
      const legend: Legend = { position: 'top', series: ['series1'] };
      expect(validateLegend(JSON.stringify(legend))).toEqual(legend);
    });

    it('returns undefined for invalid JSON or unsupported structure', () => {
      expect(validateLegend('{"position": "middle"}')).toBeUndefined();
    });
  });

  describe('validateFormatter', () => {
    it('returns a valid Formatter function for correct string input', () => {
      const formatterStr = '(value) => value.toFixed(2)';
      const formatter = validateFormatter(formatterStr) as Formatter;
      expect(formatter(10.1234, {} as FormatterHelpers)).toBe('10.12');
    });

    it('returns undefined for invalid formatter strings', () => {
      expect(validateFormatter('invalid code')).toBeUndefined();
    });
  });

  describe('validateLineFormatter', () => {
    it('returns a valid LineFormatter function for correct string input', () => {
      const lineFormatterStr = '(args) => ({ x: args.x, y: args.y, symbol: "*" })';
      const lineFormatter = validateLineFormatter(lineFormatterStr);
      expect(lineFormatter!({ x: 1, y: 2, plotX: 1, plotY: 2, input: [], index: 0 })).toEqual({
        x: 1,
        y: 2,
        symbol: '*',
      });
    });

    it('returns undefined for invalid lineFormatter strings', () => {
      expect(validateLineFormatter('invalid code')).toBeUndefined();
    });
  });

  describe('validateSymbols', () => {
    it('returns valid Symbols object for correct JSON string input', () => {
      const symbols: Symbols = { axis: { x: '-', y: '|' }, empty: ' ' };
      expect(validateSymbols(JSON.stringify(symbols))).toEqual(symbols);
    });

    it('returns undefined for invalid JSON or unsupported structure', () => {
      expect(validateSymbols('{"invalidKey": "-"}')).toBeUndefined();
    });
  });
});
