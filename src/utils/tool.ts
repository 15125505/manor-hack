import { gWorld } from "./chain/world";
import { gMetaMask } from "./chain/metaMask";
import { gChainMock } from "./chain/chainMock";
import { ChainBase } from "./chain/chainBase";
import { MiniKit } from "@worldcoin/minikit-js";

let _chain: ChainBase | null = null;

// 检测是否为桌面版Chrome浏览器
function isDesktopChrome(): boolean {
    return !!(window as any).chrome && !!(window as any).chrome.runtime;
}

export function initChain() {
    // 检查是否为桌面版Chrome浏览器来决定是否使用模拟模式
    if (isDesktopChrome()) {
        console.log("🎭 检测到桌面版Chrome浏览器，启用链操作模拟模式");
        _chain = gChainMock;
        return;
    }

    console.log("🔗 使用真实链环境");

    // 强制安装MiniKit
    MiniKit.install();

    // 如果MiniKit已安装，则使用World链
    if (gWorld.isValid()) {
        _chain = gWorld;
    }

    // 如果MetaMask已安装，则使用MetaMask链
    else if (gMetaMask.isValid()) {
        _chain = gMetaMask;
    }
}

export function getChain() {
    return _chain;
}

// 开发模式提示
if (isDesktopChrome()) {
    console.log("🎭 Mock模式已启用 - 修改 chainMock.ts 代码来控制测试行为");
}
