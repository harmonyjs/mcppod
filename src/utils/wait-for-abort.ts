/**
 * Waits for an AbortSignal to be aborted and resolves with the abort reason.
 * @param {AbortSignal} signal - The AbortSignal to listen for.
 * @returns {Promise<any>} A Promise that resolves with the signal's abort reason.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function waitForAbort(signal: AbortSignal): Promise<any> {
    if (signal.aborted) {
        // Immediately resolve if the signal is already aborted.
        return Promise.resolve(signal.reason);
    }

    return new Promise((resolve) => {
        const onAbort = () => {
            // Cleanup the event listener after it's triggered
            signal.removeEventListener('abort', onAbort);
            resolve(signal.reason);
        };

        signal.addEventListener('abort', onAbort);
    });
}
