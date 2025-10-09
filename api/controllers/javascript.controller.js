// In api/controllers/javascript.controller.js

import vm from 'node:vm';
import { errorHandler } from '../utils/error.js';

// Executes user-provided JavaScript in a restricted VM context
// Captures console output and returns it as the response
export const runJavascriptCode = async (req, res, next) => {
  const { code } = req.body ?? {};

  if (!code || typeof code !== 'string') {
    return next(errorHandler(400, 'JavaScript code is required.'));
  }

  // Capture console output
  let output = '';
  const sandboxConsole = {
    log: (...args) => {
      output += `${args.map(String).join(' ')}\n`;
    },
    error: (...args) => {
      output += `${args.map(String).join(' ')}\n`;
    },
    warn: (...args) => {
      output += `${args.map(String).join(' ')}\n`;
    },
    info: (...args) => {
      output += `${args.map(String).join(' ')}\n`;
    },
  };

  // Minimal, locked-down global context
  const context = vm.createContext({ console: sandboxConsole });

  try {
    const script = new vm.Script(code, { displayErrors: true });
    // Limit execution time and disable async require/import
    script.runInContext(context, { timeout: 1000 });
  } catch (err) {
    return next(errorHandler(400, String(err && err.message ? err.message : err)));
  }

  return res.status(200).json({ output, error: false });
};
