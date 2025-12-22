import {z} from "zod";
import {server, isLoading} from "./xiaobenyang_mcp_tools.js";

export const configSchema = z.object({
})

// export const configSchema = z.object({
//     XBY_APIKEY: z.string().describe("Your API key"),
//     MCP_ID: z.string().describe("Model to use"),
// });

export default function createServer({config,}: { config: z.infer<typeof configSchema> }) {

    while (!isLoading) {
        setTimeout(() => {
            console.log('500 毫秒后执行');
        }, 500);
    }

    return server.server;
}
