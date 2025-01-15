import type {
    CallToolRequest,
    CallToolResult,
    ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import type { McpPodTool } from './types/tool.js';
import logger from './logger.js';
import type { ZodTypeAny, ZodFirstPartySchemaTypes } from 'zod';
import { waitForTimeout } from './utils/wait-for-timeout.js';
import { waitForAbort } from './utils/wait-for-abort.js';

const TOOL_TIMEOUT = 30000; // 30 seconds

/**
 * Registry for managing MCP Pod tools. Handles tool registration, validation,
 * and execution with proper error handling and timeouts.
 *
 * The registry ensures:
 * - Unique tool names across the registry
 * - Runtime validation of tool arguments using Zod schemas
 * - Proper error wrapping and logging during tool execution
 * - Timeout handling for long-running tools
 * - Abort signal support for cancellable operations
 */
export class McpPodToolRegistry {
    private tools: Map<string, McpPodTool>;

    constructor() {
        this.tools = new Map();
    }

    /**
     * Returns tool definitions in a format compatible with the MCP protocol.
     * Transforms internal tool representations into a standardized format that includes:
     * - Tool name and description
     * - Input schema with property types and descriptions derived from Zod schemas
     *
     * @returns {ListToolsResult} List of tool definitions in MCP-compatible format
     */
    getDefinitions(): ListToolsResult {
        return {
            tools: Array.from(this.tools.values()).map((tool) => {
                const properties: Record<string, unknown> = {};

                for (const [key, schema] of Object.entries(tool.arguments)) {
                    // 💡 Casting `schema` to `ZodFirstPartySchemaTypes`, then we'll have access
                    //    to typeName and TypeScript will automatically perform type narrowing
                    //    https://github.com/colinhacks/zod/issues/2543#issuecomment-2044103460
                    const { _def, description } = schema as ZodFirstPartySchemaTypes;
                    const type = _def.typeName;
                    properties[key] = {
                        type,
                        description,
                    };
                }

                return {
                    name: tool.name,
                    description: tool.description,
                    inputSchema: {
                        type: 'object',
                        properties,
                    },
                };
            }),
        };
    }

    /**
     * Registers a new tool in the registry.
     * Ensures tool names are unique to prevent conflicts.
     *
     * @param {McpPodTool} tool - The tool to register
     * @throws {McpError} If a tool with the same name is already registered
     */
    register(tool: McpPodTool): void {
        if (this.tools.has(tool.name)) {
            throw new McpError(
                ErrorCode.InvalidRequest,
                `Tool "${tool.name}" is already registered`
            );
        }

        this.tools.set(tool.name, tool);
        logger.info({ tool: tool.name }, 'Tool registered');
    }

    /**
     * Checks if a tool with the given name exists in the registry.
     *
     * @param {string} toolName - Name of the tool to check
     * @returns {boolean} True if the tool exists, false otherwise
     */
    has(toolName: string): boolean {
        return this.tools.has(toolName);
    }

    /**
     * Executes a tool with the provided arguments and handles all aspects of tool execution:
     * - Validates tool existence and arguments using Zod schemas
     * - Implements timeout handling (30 seconds by default)
     * - Supports execution cancellation via abort signal
     * - Provides proper error handling and logging
     *
     * The execution is wrapped in a Promise.race between:
     * - The actual tool execution
     * - A timeout promise
     * - An abort signal handler
     *
     * @param {CallToolRequest} request - The tool execution request
     * @param {{ signal: AbortSignal }} options - Execution options with abort signal
     * @returns {Promise<CallToolResult>} The tool execution result
     * @throws {McpError} For various error conditions (tool not found, invalid args, timeout, etc.)
     */
    async callToolHandler(
        request: CallToolRequest,
        { signal }: { signal: AbortSignal }
    ): Promise<CallToolResult> {
        const tool = this.tools.get(request.params.name);
        if (!tool) {
            throw new McpError(ErrorCode.MethodNotFound, `Tool "${request.params.name}" not found`);
        }

        if (signal.aborted) {
            throw new McpError(
                ErrorCode.InternalError,
                `Tool "${request.params.name}" execution was aborted before starting`
            );
        }

        const invocationLogger = logger.child({ tool: tool.name });

        // Validate arguments
        const validatedArgs: Record<string, unknown> = {};

        for (const [key, schema] of Object.entries(tool.arguments)) {
            const result = (schema as ZodTypeAny).safeParse(request.params.arguments?.[key]);
            if (!result.success) {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `Invalid argument "${key}" for tool "${tool.name}": ${result.error.message}`
                );
            }
            validatedArgs[key] = result.data;
        }

        try {
            return await Promise.race([
                // Execute the actual tool handler with validated arguments
                // This is the main promise that we expect to resolve under normal circumstances
                // The handler receives both a logger for tracking execution and the abort signal
                tool.handler(validatedArgs, { logger: invocationLogger, signal }),
                // Handle abort signal by creating a promise that rejects when the signal is triggered
                // This allows for graceful cancellation of tool execution when requested
                waitForAbort(signal).then((reason: string) => {
                    invocationLogger.warn({ reason }, 'Tool execution aborted');
                    throw new McpError(
                        ErrorCode.InternalError,
                        `Tool "${tool.name}" execution was aborted`
                    );
                }),
                // Create a timeout promise that rejects after TOOL_TIMEOUT milliseconds
                // This prevents tools from running indefinitely and potentially blocking the system
                // If this promise wins the race, the tool execution is considered failed
                waitForTimeout(TOOL_TIMEOUT).then(() => {
                    invocationLogger.warn({}, `Tool execution timed out after ${TOOL_TIMEOUT}ms`);
                    throw new McpError(
                        ErrorCode.RequestTimeout,
                        `Tool "${tool.name}" execution timed out`
                    );
                }),
            ]);
        } catch (error) {
            if (error instanceof McpError) {
                throw error;
            }

            invocationLogger.error(error, 'Tool execution error');
            throw new McpError(
                ErrorCode.InternalError,
                `Tool "${tool.name}" execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}
