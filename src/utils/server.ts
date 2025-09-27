import { gData } from "./data";

const ManorServer = "https://app.scallionmanor.com/api";

class ServerData {
    /**
     * 日志
     */
    log(...args: any[]) {
        const message = this.formatArgs(args);
        console.log("[LOG]", message);
        this.request<netRet.Log>("/log", { message }).catch(console.error);
    }

    /**
     * 信息
     */
    info(...args: any[]) {
        const message = this.formatArgs(args);
        console.log("[INFO]", message);
        this.request<netRet.Info>("/info", { message }).catch(console.error);
    }

    /**
     * 警告
     */
    warn(...args: any[]) {
        const message = this.formatArgs(args);
        console.warn("[WARN]", message);
        this.request<netRet.Warn>("/warn", { message }).catch(console.error);
    }

    /**
     * 错误
     */
    error(...args: any[]) {
        const message = this.formatArgs(args);
        console.error("[ERROR]", message);
        this.request<netRet.Error>("/error", { message }).catch(console.error);
    }

    private formatArgs(args: any[]) {
        const message = args.map((arg) => (typeof arg == "object" ? JSON.stringify(arg) : String(arg))).join(" ");
        return this.addUserPrefix(message);
    }

    private addUserPrefix(message: string): string {
        const userAddress = gData.userAddress;
        const manorName = gData.manorName;

        if (!userAddress) {
            return message;
        }

        // 格式化用户地址（显示前6位和后4位）
        const shortAddress = userAddress.length > 10
            ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
            : userAddress;

        // 如果有庄园名称则显示，否则只显示地址
        const userPrefix = manorName
            ? `[${shortAddress}|${manorName}]`
            : `[${shortAddress}]`;

        return `${userPrefix} ${message}`;
    }

    /**
     * 向服务器发起请求
     */
    private async request<Ret = any, Param = any>(uri: string, param: Param): Promise<Ret> {
        console.log("-----请求：", uri, param);

        // 将参数转换为json字符串
        const data = JSON.stringify(param);

        // 使用fetch执行网络请求
        const response = await fetch(ManorServer + uri, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: data,
        });

        let retData: any;
        try {
            if (!response.ok) {
                await Promise.reject(`${response.status} ${response.statusText}`);
            }
            retData = await response.json();
        } catch (e) {
            await Promise.reject(e);
        }

        return retData as Ret;
    }

    /**
     * 字符串转字节数组
     */
    string2Bytes(str: string) {
        const out = [];
        let p = 0;
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            if (c < 128) {
                out[p++] = c;
            } else if (c < 2048) {
                out[p++] = (c >> 6) | 192;
                out[p++] = (c & 63) | 128;
            } else if ((c & 0xfc00) == 0xd800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) == 0xdc00) {
                c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
                out[p++] = (c >> 18) | 240;
                out[p++] = ((c >> 12) & 63) | 128;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            } else {
                out[p++] = (c >> 12) | 224;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            }
        }
        return out;
    }

    /**
     * 字节数组转字符串
     */
    bytes2String(bytes: Uint8Array) {
        let out = "",
            i = 0;
        const len = bytes.length;
        while (i < len) {
            let c = bytes[i++];
            if (c > 191 && c < 224) {
                if (i >= len) {
                    throw "UTF-8 decode: incomplete 2-byte sequence";
                }
                c = ((c & 31) << 6) | (bytes[i++] & 63);
            } else if (c > 223 && c < 240) {
                if (i + 1 >= len) {
                    throw "UTF-8 decode: incomplete 3-byte sequence";
                }
                c = ((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
            } else if (c > 239 && c < 248) {
                if (i + 2 >= len) {
                    throw "UTF-8 decode: incomplete 4-byte sequence";
                }
                c = ((c & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
            }
            if (c <= 0xffff) {
                out += String.fromCharCode(c);
            } else if (c <= 0x10ffff) {
                c -= 0x10000;
                out += String.fromCharCode(0xd800 | (c >> 10));
                out += String.fromCharCode(0xdc00 | (c & 0x3ff));
            } else {
                throw "UTF-8 decode: code point 0x" + c.toString(16) + " exceeds UTF-16 reach";
            }
        }
        return out;
    }
}

export const gServer = new ServerData();
