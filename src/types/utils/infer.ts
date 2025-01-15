import { z, ZodTypeAny } from 'zod';
import type { Flatten } from './flatten.js';

/**
 * Extracts and flattens TypeScript types from Zod schemas.
 * Combines Zod's type inference with recursive type flattening
 * to produce clean, simplified type definitions.
 *
 * @example
 *   const ToolSchema = z.object({
 *     name: z.string(),
 *     handler: z.function()
 *       .args(z.custom<any>(), z.object({
 *         logger: z.custom<Logger>()
 *       }))
 *       .returns(z.promise(z.any()))
 *   });
 *
 *   type Tool = Infer<typeof ToolSchema>;
 *   // Result: {
 *   //   name: string;
 *   //   handler: (arg1: any, arg2: { logger: Logger }) => Promise<any>;
 *   // }
 *
 * Used throughout the MCP tool system to derive TypeScript types
 * from Zod schemas while maintaining clean type structures.
 *
 * @param Schema The Zod schema to extract and flatten types from
 */
export type Infer<Schema extends ZodTypeAny> = Flatten<z.infer<Schema>>;
