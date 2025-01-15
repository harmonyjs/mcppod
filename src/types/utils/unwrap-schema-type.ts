import { z } from 'zod';

/**
 * Unwraps Zod schema types to their underlying types.
 * 
 * @example
 *   // Tool arguments schema
 *   type DateTimeArgs = {
 *     format: z.ZodOptional<z.ZodString>,
 *     locale: z.ZodOptional<z.ZodString>,
 *     zone: z.ZodOptional<z.ZodString>,
 *     preset: z.ZodOptional<z.ZodString>
 *   };
 *   
 *   type UnwrappedArgs = UnwrapSchemaType<DateTimeArgs, Record<string, z.ZodType>>;
 *   // Result: {
 *   //   readonly format?: string;
 *   //   readonly locale?: string;
 *   //   readonly zone?: string;
 *   //   readonly preset?: string;
 *   // }
 *
 * @param T Zod schema type
 * @param TDef Zod schema definition
 */
export type UnwrapSchemaType<T extends TDef, TDef extends Record<string, z.ZodType>> = {
  // Maps over each property in the schema, preserving readonly modifier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [K in keyof T]: T[K] extends z.ZodOptional<any>
                         ? // For optional fields (wrapped in ZodOptional), extract the inner type and make it nullable
                           (T[K] extends z.ZodType<infer U> ? U : never) | undefined
                         : // For required fields, directly extract the inner type from the Zod schema
                            T[K] extends z.ZodType<infer U> ? U : never
                         ;
};
