// Create by zhoufeng
// Description: 上传本地版本到服务器

import { NodeSSH } from "node-ssh";
import * as fs from "fs";
import * as path from "path";

interface Config {
    ssh: {
        host: string;
        port: number;
        username: string;
        password: string;
    };
    paths: {
        local: string;
        remote: string;
    };
}

async function loadConfig(): Promise<Config> {
    const configPath = path.join(__dirname, "config.json");
    if (!fs.existsSync(configPath)) {
        throw new Error("配置文件 config.json 不存在，请先创建配置文件");
    }
    const configContent = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(configContent);
}

async function upload() {
    // 加载配置
    const config = await loadConfig();

    // 连接服务器
    const ssh = new NodeSSH();
    await ssh.connect({
        host: config.ssh.host,
        port: config.ssh.port,
        username: config.ssh.username,
        password: config.ssh.password,
    });
    console.log("服务器连接成功");

    // 复制本地目录到远程服务器
    const localPath = config.paths.local;
    const remotePath = config.paths.remote;
    await ssh.putDirectory(localPath, remotePath, {
        tick: (localPath, remotePath, error) => {
            if (error) {
                console.error("文件", localPath, "上传失败", error);
            } else {
                console.log("文件", localPath, "上传成功", remotePath);
            }
        },
        recursive: true,
    });
    console.log("文件全部上传成功！");

    // 关闭连接
    ssh.dispose();
}

upload().catch((e) => console.log("上传文件失败：", e));
