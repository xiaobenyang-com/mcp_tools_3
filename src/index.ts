import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {z, ZodType} from "zod";

// Optional: If you have user-level config, define it here
export const configSchema = z.object({
})

const apiKey: string = process.env.API_KEY || '';
const mcpID: string = process.env.MCP_ID;

const calcXiaoBenYangApi = async function (fullArgs: Record<string, any>) {
    // 发起 POST 请求
    const response = await fetch('https://xiaobenyang.com/api', {
        method: 'POST',
        headers: {
            'APIKEY': apiKey,
            'aid': mcpID
        },
        body: new URLSearchParams(fullArgs)
    });
    const apiResult = await calcXiaoBenYangApi(fullArgs); // 假设返回 string

    return {
        content: [
            {
                type: "text",
                text: apiResult // 将字符串结果放入 content 中
            }
        ]
    };
};


const handleXiaoBenYangApi = async (args: Record<string, any>, aid: string) => {
    // 校验aid是否存在
    if (aid === undefined || aid === null) {
        throw new Error("缺少必要参数 'aid'");
    }
    // 合并参数
    const fullArgs = {...args, aid};
    // 调用API
    return calcXiaoBenYangApi(fullArgs);
};

/**
 * Java 类型转 Zod 类型的映射表
 */
const JAVA_TO_ZOD_MAP: Record<string, (...generics: string[]) => ZodType> = {
    // 基础类型（全类名）
    'java.lang.String': () => z.string(),
    'java.lang.Integer': () => z.number().int(),
    'java.lang.Long': () => z.number().int(),
    'java.lang.Float': () => z.number(),
    'java.lang.Double': () => z.number(),
    'java.lang.Boolean': () => z.boolean(),
    'java.time.LocalDate': () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    'java.time.LocalDateTime': () => z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),

    // 集合类型（全类名）
    'java.util.List': (genericType) => z.array(convertJavaTypeToZod(genericType)),
    // 'java.util.Set': (genericType) => z.array(convertJavaTypeToZod(genericType)).unique(),
    'java.util.Map': (keyType, valueType) => z.record(convertJavaTypeToZod(keyType), convertJavaTypeToZod(valueType)),

    // 简单类名映射
    String: () => z.string(),
    Integer: () => z.number().int(),
    Long: () => z.number().int(),
    Float: () => z.number(),
    Double: () => z.number(),
    Boolean: () => z.boolean(),
    List: (genericType) => z.array(convertJavaTypeToZod(genericType)),
};

/**
 * 解析 Java 泛型类型
 * @param javaType Java 类型字符串
 * @returns 解析结果 { base: 基础类型, generics: 泛型参数数组 }
 */
function parseGenericType(javaType: string): { base: string; generics: string[] } {
    const angleBracketIndex = javaType.indexOf('<');
    if (angleBracketIndex === -1) {
        return {base: javaType.trim(), generics: []};
    }

    const baseType = javaType.slice(0, angleBracketIndex).trim();
    const genericsStr = javaType.slice(angleBracketIndex + 1, javaType.lastIndexOf('>')).trim();

    const generics: string[] = [];
    let balance = 0;
    let current = '';
    for (const char of genericsStr) {
        if (char === '<') balance++;
        if (char === '>') balance--;
        if (char === ',' && balance === 0) {
            generics.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current) generics.push(current.trim());

    return {base: baseType, generics};
}

/**
 * 将 Java 类型名称转换为 Zod 类型
 * @param javaType Java 类型全名
 * @returns Zod 类型对象
 */
function convertJavaTypeToZod(javaType: string): ZodType {
    const {base: baseType, generics} = parseGenericType(javaType);

    if (JAVA_TO_ZOD_MAP[baseType]) {
        return JAVA_TO_ZOD_MAP[baseType](...generics);
    }

    const simpleTypeName = baseType.split('.').pop() || baseType;
    if (JAVA_TO_ZOD_MAP[simpleTypeName]) {
        return JAVA_TO_ZOD_MAP[simpleTypeName](...generics);
    }

    return z.object({});
}

// 定义参数类型接口
interface ApiParam {
    name: string;
    type: string;
    description?: string;
    required: boolean;
}

const convertParamsToZ = function (params: Record<string, string>) {
    const zParams: Record<string, ZodType> = {};
    for (const param in params) {
        let zodType = convertJavaTypeToZod(param["type"]);
        if (param["description"]) {
            zodType = zodType.describe(param["description"]);
        }
        if (!param["required"]) { // 注意：原逻辑可能有误，required为true时不应optional
            zodType = zodType.optional();
        }

        zParams[param["name"]] = zodType;
    }
    console.log(JSON.stringify(zParams))
    return zParams;
};

export default function createServer({config,}: { config: z.infer<typeof configSchema> }) {
    const server = new McpServer({
        name: "Say Hello",
        version: "1.0.0",
    })
    let isLoading: boolean = false;

     fetch('https://xiaobenyang.com/api/' + mcpID, {
        method: 'GET',
    }).then((res) => {
        if (!res.ok) throw new Error(`请求失败：${res.status}`);
        return res.json(); // 解析响应体为 JSON（假设返回 { apiDescList: [...] }）
    })
        .then((data) => {
            const apiDescList = data.tools;

            const addToolXiaoBenYangApi = function (
                aid: string,
                title: string,
                desc: string,
                params: Record<string, ZodType>
            ) {
                server.registerTool(
                    title,
                    {
                        title: title,
                        description: desc,
                        inputSchema: {name: z.string().describe("Name to greet")},
                    }
                    ,
                    // async (args: Record<string, any>) => handleXiaoBenYangApi(args, aid)
                    async (args: Record<string, any>) => ({
                        content: [
                            {
                                type: "text",
                                text: "test"
                            }
                        ],
                    }),
                )
            };

            for (const apiDesc of apiDescList) {
                addToolXiaoBenYangApi(apiDesc.apiId.toString(),
                    apiDesc.title,
                    apiDesc.description ? apiDesc.description : apiDesc.title,
                    // convertParamsToZ(apiDesc.params)
                    null
                );
            }
            isLoading = true;

        });

     while (!isLoading) {
         setTimeout(() => {
             console.log('500 毫秒后执行');
         }, 500);
    }

    return server.server;

    // // Add a tool
    // server.registerTool(
    // 	"hello",
    // 	{
    // 		title: "Hello Tool",
    // 		description: "Say hello to someone",
    // 		inputSchema: { name: z.string().describe("Name to greet") },
    // 	},
    // 	async ({ name }) => ({
    // 		content: [
    // 			{
    // 				type: "text",
    // 				text: config.debug ? `DEBUG: Hello ${name}` : `Hello, ${name}!` // use provided config
    // 			}
    // 		],
    // 	}),
    // )


}
