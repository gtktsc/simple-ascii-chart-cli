import { exec } from 'child_process';

describe('plotter script', () => {
  // @ts-expect-error tests
  const execPlotterScript = (args, callback) => {
    exec(`node dist/cli.js ${args}`, callback);
  };

  it('should require the --input option', (done) => {
    // @ts-expect-error tests
    execPlotterScript('', (error, stdout, stderr) => {
      expect(stderr).toContain('Missing required argument: input');
      done();
    });
  });

  it('should output a plot when given valid input', (done) => {
    const validInput = JSON.stringify([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
    // @ts-expect-error tests
    execPlotterScript(`--input '${validInput}'`, (error, stdout, stderr) => {
      expect(error).toBeNull();
      expect(stderr).toBe('');
      expect(stdout).toContain(`
 ▲    
3┤ ┏━ 
2┤┏┛  
1┤┛   
 └┬┬┬▶
  123 
`);
      done();
    });
  });

  it('should handle invalid JSON input gracefully', (done) => {
    const invalidInput = '[ invalid json';
    // @ts-expect-error tests
    execPlotterScript(`--input '${invalidInput}'`, (error, stdout, stderr) => {
      expect(stderr).toContain('Oops! Something went wrong!');
      done();
    });
  });
});
