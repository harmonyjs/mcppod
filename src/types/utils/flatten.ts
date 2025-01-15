/**
 * Types that should not be recursively flattened.
 */
type Primitive = Function | string | number | boolean | bigint | null | undefined;

/**
 * Recursively flattens complex nested types into simpler structures.
 * Preserves the shape of the type while simplifying nested type definitions.
 *
 * Handles:
 * - Primitive types (passed through unchanged)
 * - Arrays (flattens element types)
 * - Sets (flattens element types)
 * - Maps (flattens both key and value types)
 * - Objects (flattens property types)
 *
 * @example
 *   // Complex nested type
 *   type Nested = {
 *     data: Array<{
 *       id: number,
 *       metadata: Map<string, Set<{
 *         tag: string,
 *         value: number
 *       }>>
 *     }>
 *   };
 *
 *   type Flattened = Flatten<Nested>;
 *   // Result: {
 *   //   data: {
 *   //     id: number,
 *   //     metadata: Map<string, Set<{
 *   //       tag: string,
 *   //       value: number
 *   //     }>>
 *   //   }[]
 *   // }
 *
 * Used in combination with Infer to simplify types extracted
 * from Zod schemas in the MCP tool system.
 *
 * @param T The type to flatten
 */
export type Flatten<T> = T extends Primitive
    ? T // Pass through primitive types unchanged
    : T extends Array<infer U>
      ? Array<Flatten<U>> // Recursively flatten array elements
      : T extends Set<infer U>
        ? Set<Flatten<U>> // Recursively flatten set elements
        : T extends Map<infer K, infer V>
          ? Map<Flatten<K>, Flatten<V>> // Recursively flatten both map keys and values
          : T extends object
            ? { [K in keyof T]: Flatten<T[K]> } // Recursively flatten each object property
            : T; // Fallback for any other types
