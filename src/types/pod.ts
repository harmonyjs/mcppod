import { z } from 'zod';
import { ServerCapabilitiesSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Infer } from './utils/infer.js';
import { McpPodToolSchema } from './tool.js';

/**
 * Schema for MCP Pod configuration options.
 * Defines the structure and validation rules for Pod initialization parameters.
 */
export const McpPodOptionsSchema = z.object({
    /**
     * The name identifier for this MCP server.
     * Used to uniquely identify this server instance.
     */
    name: z.string(),

    /**
     * The semantic version of this server.
     * Should follow semver format (e.g., "1.0.0").
     */
    version: z.string(),

    /**
     * Array of tools to register with this Pod.
     * Each tool provides specific functionality that can be called through the MCP protocol.
     */
    tools: z.array(McpPodToolSchema),

    /**
     * Server capabilities configuration.
     * Defines what features and operations this server supports.
     */
    capabilities: ServerCapabilitiesSchema,
});

/**
 * Configuration options type for initializing an MCP Pod.
 * @see McpPodOptionsSchema for detailed field descriptions and validation rules.
 */
export type McpPodOptions = Infer<typeof McpPodOptionsSchema>;
