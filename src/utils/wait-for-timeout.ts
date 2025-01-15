/**
 * Waits for the specified timeout duration and resolves the promise.
 * @param {number} ms - The timeout duration in milliseconds.
 * @returns {Promise<void>} A Promise that resolves after the specified time.
 */
export function waitForTimeout(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
