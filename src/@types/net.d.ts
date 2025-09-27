// 协议定义文件 - 这里定义复杂的嵌套结构
// 这个文件将被解析并生成对应的 Rust 代码

declare namespace netParam {
    // 日志
    interface Log {
        message: string;
    }

    // Info
    interface Info {
        message: string;
    }

    // Warn
    interface Warn {
        message: string;
    }

    // Error
    interface Error {
        message: string;
    }
}

declare namespace netRet {
    // 日志
    interface Log {
    }

    // Info
    interface Info {
    }

    // Warn
    interface Warn {
    }

    // Error
    interface Error {
    }
}