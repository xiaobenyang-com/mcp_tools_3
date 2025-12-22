import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {z, ZodType} from "zod";

// Optional: If you have user-level config, define it here

const apiKey: string = process.env.XBY_APIKEY || '';
// const mcpID: string = process.env.MCP_ID;
const mcpID: string = '1777316659717123';

console.log("apiKey: " + apiKey)
console.log("mcpID: " + mcpID)

const calcXiaoBenYangApi = async function (fullArgs: Record<string, any>) {
    // 发起 POST 请求
    let response = await fetch('https://mcp.xiaobenyang.com/api', {
        method: 'POST',
        headers: {
            'XBY-APIKEY': apiKey,
            'func': fullArgs.toolName,
            'mcpid': mcpID
        },
        body: new URLSearchParams(fullArgs)
    });
    const apiResult = await response.text();

    return {
        content: [
            {
                type: "text",
                text: apiResult // 将字符串结果放入 content 中
            }
        ]
    };
};


const  handleXiaoBenYangApi = async (args: Record<string, any>, toolName: string) => {
    // 校验aid是否存在
    if (toolName === undefined || toolName === null) {
        throw new Error("缺少必要参数 'aid'");
    }
    // 合并参数
    const fullArgs = {...args, toolName:toolName};
    // 调用API
    return calcXiaoBenYangApi(fullArgs);
};


const server = new McpServer({
    name: "Say Hello",
    version: "1.0.0",
})

let isLoading: boolean = false;

fetch('https://mcp.xiaobenyang.com/getMcpDesc?mcpId=' + mcpID, {
    method: 'GET',
}).then((res) => {
    if (!res.ok) {
        throw new Error(`请求失败：${res.status}`);
    }
    return res.json(); // 解析响应体为 JSON（假设返回 { apiDescList: [...] }）
})
    .then((data) => {
        const apiDescList = data.tools;

        const addToolXiaoBenYangApi = function (
            name: string,
            desc: string,
            params: Record<string, ZodType>
        ) {
            server.registerTool(
                name,
                {
                    title: name,
                    description: desc,
                    inputSchema: params,
                }
                ,
                async (args: Record<string, any>) => handleXiaoBenYangApi(args, name)
            )
        };

        for (const apiDesc of apiDescList) {
            let inputSchema = JSON.parse(apiDesc.inputSchema);
            const zodDict = {};

            // 遍历 properties 中的每个字段
            Object.entries(inputSchema.properties).forEach(([name, propConfig]) => {
                console.log("param name: " + name)
                let zodType;
                // 根据 type 映射 Zod 类型（可扩展更多类型）
                let pt = (propConfig as { type: string }).type;
                switch (pt) {
                    case 'string':
                        zodType = z.string();
                        break;
                    case 'number':
                        zodType = z.number();
                        break;
                    case 'boolean':
                        zodType = z.boolean();
                        break;
                    case 'integer':
                        zodType = z.bigint();
                        break;
                    case 'array':
                        zodType = z.array(z.any());
                        break;
                    case 'object':
                        zodType = z.object(z.any());
                        break;
                    default:
                        zodType = z.any();
                }

                // 如果字段在 required 中，设置为必填
                if (inputSchema.required?.includes(name)) {
                    zodDict[name] = zodType;
                } else {
                    zodDict[name] = zodType.optional();
                }
            });

            addToolXiaoBenYangApi(
                apiDesc.name,
                apiDesc.description ? apiDesc.description : apiDesc.name,
                z.object(zodDict));
            console.log("api name: " + apiDesc.name)
            console.log("api desc: " + (apiDesc.description ? apiDesc.description : apiDesc.name))
            console.log("api z: " + JSON.stringify(zodDict));
        }
        isLoading = true;
    });


export { server, isLoading};
