import {
  validateAxisCenter,
  validateColors,
  validateYRange,
  validateThresholds,
  validatePoints,
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

    it('coerces numeric strings to numbers', () => {
      expect(validateAxisCenter(['0', '100'])).toEqual([0, 100]);
    });

    it('returns undefined for invalid input', () => {
      expect(validateAxisCenter([1])).toBeUndefined();
      expect(validateAxisCenter(['a', 'b'])).toBeUndefined();
      expect(validateAxisCenter([Number.POSITIVE_INFINITY, 2])).toBeUndefined();
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

    it('returns undefined for missing color input', () => {
      expect(validateColors(undefined)).toBeUndefined();
    });
  });

  describe('validateYRange', () => {
    it('returns a valid [number, number] tuple for valid input', () => {
      expect(validateYRange([10, 20])).toEqual([10, 20]);
    });

    it('coerces numeric strings to numbers', () => {
      expect(validateYRange(['0', '100'])).toEqual([0, 100]);
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

    it('supports a JSON object string input', () => {
      expect(validateThresholds('{"y":2,"color":"ansiRed"}')).toEqual([
        { y: 2, color: 'ansiRed' },
      ]);
    });

    it('supports a JSON array string input', () => {
      expect(validateThresholds('[{"y":2},{"x":4}]')).toEqual([{ y: 2 }, { x: 4 }]);
    });

    it('supports legacy tokenized JSON objects', () => {
      expect(validateThresholds(['{"y":2}', '{"x":4,"color":"ansiGreen"}'])).toEqual([
        { y: 2 },
        { x: 4, color: 'ansiGreen' },
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

    it('returns undefined for invalid string payload', () => {
      expect(validateThresholds('not-json')).toBeUndefined();
    });

    it('ignores primitive candidates in legacy arrays', () => {
      expect(validateThresholds([123, '{"y":2}'])).toEqual([{ y: 2 }]);
    });

    it('returns undefined for missing thresholds input', () => {
      expect(validateThresholds(undefined)).toBeUndefined();
    });
  });

  describe('validatePoints', () => {
    it('supports a JSON object string input', () => {
      expect(validatePoints('{"x":1,"y":2,"color":"ansiGreen"}')).toEqual([
        { x: 1, y: 2, color: 'ansiGreen' },
      ]);
    });

    it('supports a JSON array string input', () => {
      expect(validatePoints('[{"x":1,"y":2},{"x":3,"y":4}]')).toEqual([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]);
    });

    it('supports legacy tokenized JSON objects', () => {
      expect(validatePoints(['{"x":1,"y":2}', '{"x":3,"y":4,"color":"ansiRed"}'])).toEqual([
        { x: 1, y: 2 },
        { x: 3, y: 4, color: 'ansiRed' },
      ]);
    });

    it('returns undefined for invalid payloads', () => {
      expect(validatePoints('not-json')).toBeUndefined();
      expect(validatePoints('[{"x":"a","y":"b"}]')).toBeUndefined();
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

    it('accepts legend with series only', () => {
      expect(validateLegend('{"series":["a","b"]}')).toEqual({ series: ['a', 'b'] });
    });

    it('accepts legend with string-based labels', () => {
      expect(
        validateLegend('{"series":"series-a","points":"p","thresholds":"warn","position":"left"}'),
      ).toEqual({
        series: 'series-a',
        points: 'p',
        thresholds: 'warn',
        position: 'left',
      });
    });

    it('rejects invalid position even when series is provided', () => {
      expect(validateLegend('{"position":"middle","series":["cpu"]}')).toBeUndefined();
    });

    it('rejects non-object and malformed legend payloads', () => {
      expect(validateLegend('[]')).toBeUndefined();
      expect(validateLegend('not-json')).toBeUndefined();
    });

    it('rejects invalid legend field value types independently', () => {
      expect(validateLegend('{"series":123}')).toBeUndefined();
      expect(validateLegend('{"points":123}')).toBeUndefined();
      expect(validateLegend('{"thresholds":123}')).toBeUndefined();
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
      expect(
        lineFormatter!({
          x: 1,
          y: 2,
          plotX: 1,
          plotY: 2,
          input: [],
          index: 0,
          minX: 0,
          minY: 0,
          expansionX: [0, 0],
          expansionY: [0, 0],
          toPlotCoordinates: () => [0, 0],
        }),
      ).toEqual({
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

    it('returns undefined for malformed JSON', () => {
      expect(validateSymbols('{invalid')).toBeUndefined();
    });

    it('accepts symbol payloads that use point and thresholds keys', () => {
      expect(validateSymbols('{"point":"*","thresholds":{"x":"-","y":"|"}}')).toEqual({
        point: '*',
        thresholds: { x: '-', y: '|' },
      });
    });

    it('accepts chart/background/border symbol keys', () => {
      expect(validateSymbols('{"chart":{"we":"-"},"background":".","border":"|"}')).toEqual({
        chart: { we: '-' },
        background: '.',
        border: '|',
      });
    });

    it('rejects non-object symbol payloads and invalid field types', () => {
      expect(validateSymbols('[]')).toBeUndefined();
      expect(validateSymbols('{"axis":"-"}')).toBeUndefined();
      expect(validateSymbols('{"chart":"-"}')).toBeUndefined();
      expect(validateSymbols('{"thresholds":"-"}')).toBeUndefined();
      expect(validateSymbols('{"empty":1}')).toBeUndefined();
      expect(validateSymbols('{"background":1}')).toBeUndefined();
      expect(validateSymbols('{"border":1}')).toBeUndefined();
      expect(validateSymbols('{"point":1}')).toBeUndefined();
    });
  });
});
