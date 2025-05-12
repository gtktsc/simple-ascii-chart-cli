import { exec } from 'child_process';
import path from 'path';

const cliPath = path.resolve(__dirname, '../../dist/cli.js'); // <-- LOCAL build output

function execPlotterScript(
  args: string,
  callback: (error: Error | null, stdout: string, stderr: string) => void,
) {
  exec(`node ${cliPath} ${args}`, callback);
}

describe('plotter script', () => {
  it('should require the --input option', (done) => {
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

    execPlotterScript(`--input '${invalidInput}'`, (error, stdout, stderr) => {
      expect(stderr).toContain('Oops! Something went wrong!');
      done();
    });
  });
});
