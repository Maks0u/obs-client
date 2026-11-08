export async function sleep(ms = 1000): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitFor(
    expression: () => boolean | Promise<boolean>,
    options: { tick?: number; timeout?: number } = {}
): Promise<void> {
    const opts = {
        tick: 50,
        timeout: 1000,
        ...options,
    };

    let errTimeout: NodeJS.Timeout;
    const timeoutPromise = () =>
        new Promise(() => {
            errTimeout = setTimeout(() => {
                throw new Error('waitFor timeout');
            }, opts.timeout);
        });

    async function expectPromise() {
        while (!(await expression())) await sleep(opts.tick); // NOSONAR
    }

    await Promise.race([timeoutPromise(), expectPromise()]);

    // @ts-ignore
    clearTimeout(errTimeout);
}
