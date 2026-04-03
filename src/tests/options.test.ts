import { preparePlotOptions } from '../options';

describe('preparePlotOptions', () => {
  it('maps debugMode and mode from direct CLI fields', () => {
    const settings = preparePlotOptions({
      debugMode: true,
      mode: 'point',
    });

    expect(settings.debugMode).toBe(true);
    expect(settings.mode).toBe('point');
  });

  it('allows direct fields to override --options JSON', () => {
    const settings = preparePlotOptions({
      options: '{"debugMode":false,"mode":"line"}',
      debugMode: true,
      mode: 'bar',
    });

    expect(settings.debugMode).toBe(true);
    expect(settings.mode).toBe('bar');
  });

  it('parses thresholds and points from JSON strings', () => {
    const settings = preparePlotOptions({
      color: 'ansiRed',
      thresholds: '{"y":2,"color":"ansiRed"}',
      points: '[{"x":1,"y":2},{"x":3,"y":4,"color":"ansiGreen"}]',
    });

    expect(settings.color).toBe('ansiRed');
    expect(settings.thresholds).toEqual([{ y: 2, color: 'ansiRed' }]);
    expect(settings.points).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4, color: 'ansiGreen' },
    ]);
  });

  it('supports legacy tokenized JSON input for thresholds and points', () => {
    const settings = preparePlotOptions({
      thresholds: ['{"y":2}', '{"x":4}'],
      points: ['{"x":2,"y":3}', '{"x":4,"y":5}'],
    });

    expect(settings.thresholds).toEqual([{ y: 2 }, { x: 4 }]);
    expect(settings.points).toEqual([
      { x: 2, y: 3 },
      { x: 4, y: 5 },
    ]);
  });

  it('ignores invalid thresholds and points payloads', () => {
    const settings = preparePlotOptions({
      thresholds: 'invalid-json',
      points: '[{"x":"a","y":"b"}]',
    });

    expect(settings.thresholds).toBeUndefined();
    expect(settings.points).toBeUndefined();
  });

  it('throws an actionable error for invalid --options JSON', () => {
    expect(() =>
      preparePlotOptions({
        options: '{"broken":',
      }),
    ).toThrow(/Invalid --options JSON/);
  });

  it('throws an actionable error for invalid --legend JSON payloads', () => {
    expect(() =>
      preparePlotOptions({
        legend: '{"position":"middle","series":["cpu"]}',
      }),
    ).toThrow(/Invalid --legend JSON/);
  });

  it('emits warnings when thresholds/points payloads are invalid', () => {
    const warnings: string[] = [];

    const settings = preparePlotOptions({
      thresholds: 'invalid-json',
      points: 'invalid-json',
      onWarning: (message) => warnings.push(message),
    });

    expect(settings.thresholds).toBeUndefined();
    expect(settings.points).toBeUndefined();
    expect(warnings).toEqual([
      'Ignoring invalid --thresholds payload. Use JSON object/array (e.g. {"y":2} or [{"y":2}]).',
      'Ignoring invalid --points payload. Use JSON object/array (e.g. {"x":1,"y":2} or [{"x":1,"y":2}]).',
    ]);
  });
});
