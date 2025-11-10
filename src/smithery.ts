import {z} from "zod";
import {configSchema, server, isLoading} from "./index";

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
