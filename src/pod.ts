import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    ErrorCode,
    McpError,
    ListToolsRequestSchema,
    CallToolRequestSchema,
    CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import type { McpPodOptions } from './types/pod.js';
import { McpPodToolRegistry } from './tool-registry.js';
import type { McpPodTool } from './types/tool.js';
import logger from './logger.js';

/**
 * MCP Pod
 * ---
 *
 * MCP Pod encapsulates the logic for setting up everything required
 * for a MCP server and running it.
 */
export class McpPod {
    private server: Server;
    private toolRegistry: McpPodToolRegistry;

    /**
     * Creates a new MCP Pod instance.
     * @param {McpPodOptions} options Configuration options for initializing the Pod
     * @throws {McpError} If initialization of server or tool registry fails
     */
    constructor(options: McpPodOptions) {
        logger.info('MCP Pod initializing');

        // Initialize server
        this.server = new Server(
            {
                name: options.name,
                version: options.version,
            },
            {
                capabilities: options.capabilities,
            }
        );

        // Initialize tool registry
        this.toolRegistry = new McpPodToolRegistry();

        // Register tools
        for (const tool of options.tools) {
            this.toolRegistry.register(tool);
        }

        // Setup request handlers
        this.server.setRequestHandler(ListToolsRequestSchema, () => {
            return this.toolRegistry.getDefinitions();
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request, { signal }) => {
            return this.toolRegistry.callToolHandler(request, { signal });
        });

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, shutting down');
            await this.server.close();
            process.exit(0);
        });

        logger.info('MCP Pod initialized');
    }

    /**
     * Returns the underlying MCP server instance.
     * This can be useful for advanced server configuration or direct access to server functionality.
     * @returns {Server} The MCP server instance managed by this Pod
     */
    getServer() {
        return this.server;
    }

    /**
     * Registers a new tool with the Pod's tool registry.
     * Tools can be registered after Pod initialization for dynamic capability extension.
     * @param tool The tool implementation to register
     * @throws {McpError} If a tool with the same name is already registered
     */
    registerTool(tool: McpPodTool) {
        this.toolRegistry.register(tool);
    }

    /**
     * Executes a registered tool by name with the provided arguments.
     * @param toolName The name of the tool to execute
     * @param args Arguments to pass to the tool, must match the tool's input schema
     * @returns Promise resolving to the tool's execution result
     * @throws {McpError} If tool is not found or execution fails
     */
    async callTool(toolName: string, args: Record<string, unknown>) {
        // Check if tool exists
        if (!this.toolRegistry.has(toolName)) {
            throw new McpError(ErrorCode.MethodNotFound, `Tool "${toolName}" not found`);
        }

        // Create abort controller for signal
        const controller = new AbortController();

        // Construct request object
        const request: CallToolRequest = {
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: args,
            },
        };

        // Call tool with request and context
        return this.toolRegistry.callToolHandler(request, { signal: controller.signal });
    }

    /**
     * Establishes connection for the MCP server using stdio transport.
     * This method must be called to start serving MCP requests.
     * @throws {McpError} If connection establishment fails
     */
    async connect() {
        try {
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            logger.info('MCP server running on stdio');
        } catch (error) {
            const message = 'Connection establishment error';
            logger.error(error, message);
            throw new McpError(ErrorCode.InternalError, message);
        }
    }
}

export default McpPod;
