/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export async function sleep(ms = 1000) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {Function} expression
 * @param {{ tick: number; timeout: number; }} options
 * @returns {Promise<void>}
 */
export async function waitFor(expression, options = {}) {
  const opts = {
    tick: 50,
    timeout: 1000,
    ...options,
  };

  let errTimeout;
  const timeoutPromise = () =>
    new Promise(() => {
      errTimeout = setTimeout(() => {
        throw new Error('waitFor timeout');
      }, opts.timeout);
    });

  async function expectPromise() {
    while (!(await expression())) await sleep(opts.tick);
  }

  await Promise.race([timeoutPromise(), expectPromise()]);
  clearTimeout(errTimeout);
}
