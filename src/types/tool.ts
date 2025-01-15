import type { Logger } from 'pino';
import { z } from 'zod';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Infer } from './utils/infer.js';

/**
 * EXPORTED SCHEMAS
 */

export const McpPodToolArgumentsDefinitionSchema = z.record(z.string(), z.instanceof(z.ZodType));

export const McpPodToolContextSchema = z.object({
    logger: z.custom<Logger>(),
    signal: z.instanceof(AbortSignal),
});

export const McpPodToolHandlerSchema = z
    .function()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .args(z.custom<any>(), McpPodToolContextSchema)
    .returns(z.promise(CallToolResultSchema));

export const McpPodToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    arguments: McpPodToolArgumentsDefinitionSchema,
    handler: McpPodToolHandlerSchema,
});

/**
 * EXPORTED TYPES
 */

export type McpPodTool = Infer<typeof McpPodToolSchema>;

export type McpPodToolContext = Infer<typeof McpPodToolContextSchema>;

export type McpPodToolArgumentsDefinition = Infer<typeof McpPodToolArgumentsDefinitionSchema>;

export type McpPodToolHandler = Infer<typeof McpPodToolHandlerSchema>;

import type { UnwrapSchemaType } from './utils/unwrap-schema-type.js';

export type McpPodToolArguments<T extends McpPodToolArgumentsDefinition> = UnwrapSchemaType<
    T,
    McpPodToolArgumentsDefinition
>;
