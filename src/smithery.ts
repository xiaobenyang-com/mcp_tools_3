import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {z} from "zod";
import {server, isLoading} from "./xiaobenyang_mcp_tools";

export const configSchema = z.object({
})

export default function createServer({config,}: { config: z.infer<typeof configSchema> }) {
    console.log("4444444");

    while (!isLoading) {
        console.log("55555");
        setTimeout(() => {
            console.log('500 毫秒后执行');
        }, 500);
    }
    console.log("66666");
    return server.server;
}
