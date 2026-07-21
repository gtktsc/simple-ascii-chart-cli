import { preparePlotOptions } from '../cli/options';

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

  it('maps every new scalar and structured plot setting', () => {
    const settings = preparePlotOptions({
      width: 'auto',
      aspectRatio: 2.5,
      overflow: 'clip',
      renderer: 'braille',
      hideXAxisTicks: true,
      hideYAxisTicks: true,
      customXAxisTicks: ['1', 2],
      customYAxisTicks: [0, '10'],
      titleColor: 'ansiBrightCyan',
      borderColor: 'ansiBrightBlue',
      backgroundColor: 'ansiBrightBlack',
      interpolation: 'linear',
      coloring: '{"thresholds":[{"value":5,"belowColor":"ansiBlue","aboveColor":"ansiRed"}]}',
      barLayout: 'grouped',
      valueLabels: '{"color":"ansiGreen"}',
      xAxis: '{"domain":[0,10],"ticks":[0,5,10]}',
      yAxis: '{"domain":[0,20]}',
    });

    expect(settings).toMatchObject({
      width: 'auto',
      aspectRatio: 2.5,
      overflow: 'clip',
      renderer: 'braille',
      hideXAxisTicks: true,
      hideYAxisTicks: true,
      customXAxisTicks: [1, 2],
      customYAxisTicks: [0, 10],
      titleColor: 'ansiBrightCyan',
      borderColor: 'ansiBrightBlue',
      backgroundColor: 'ansiBrightBlack',
      interpolation: 'linear',
      coloring: {
        thresholds: [{ value: 5, belowColor: 'ansiBlue', aboveColor: 'ansiRed' }],
      },
      barLayout: 'grouped',
      valueLabels: { color: 'ansiGreen' },
      xAxis: { domain: [0, 10], ticks: [0, 5, 10] },
      yAxis: { domain: [0, 20] },
    });
  });

  it('rejects malformed structured plot settings with option-specific errors', () => {
    expect(() => preparePlotOptions({ coloring: '{broken' })).toThrow(
      'Invalid --coloring JSON',
    );
    expect(() => preparePlotOptions({ xAxis: '[]' })).toThrow(
      'Invalid --x-axis JSON: expected an object',
    );
  });

  it('ignores invalid direct numeric arrays, widths, and colors', () => {
    expect(
      preparePlotOptions({
        width: 'invalid',
        customXAxisTicks: ['invalid'],
        customYAxisTicks: [Number.POSITIVE_INFINITY],
        titleColor: 'cyan',
        borderColor: 'blue',
        backgroundColor: 'black',
      }),
    ).toEqual({});

    expect(preparePlotOptions({ width: -1 })).toEqual({});
    expect(preparePlotOptions({ width: '20' })).toEqual({ width: 20 });
  });
});
