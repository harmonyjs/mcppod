import { describe, it, expect, vi } from 'vitest';
import { waitForAbort } from './wait-for-abort';

describe('waitForAbort', () => {
    it('should resolve immediately if signal is already aborted', async () => {
        const reason = 'Already aborted';
        const controller = new AbortController();
        controller.abort(reason);

        const result: unknown = await waitForAbort(controller.signal);

        expect(result).toBe(reason);
    });

    it('should resolve with the reason when signal is aborted', async () => {
        const reason = 'Aborted later';
        const controller = new AbortController();

        const promise = waitForAbort(controller.signal);

        controller.abort(reason);

        const result: unknown = await promise;

        expect(result).toBe(reason);
    });

    it('should clean up the abort event listener after resolving', async () => {
        const controller = new AbortController();
        const spy = vi.spyOn(controller.signal, 'removeEventListener');

        const promise = waitForAbort(controller.signal);

        controller.abort('Test reason');
        await promise;

        expect(spy).toHaveBeenCalledWith('abort', expect.any(Function));
        spy.mockRestore();
    });

    it('should not resolve if the signal is not aborted', async () => {
        const controller = new AbortController();

        const promise = waitForAbort(controller.signal);

        const result: unknown = await Promise.race([promise, Promise.resolve('not aborted')]);

        expect(result).toBe('not aborted');
    });
});
