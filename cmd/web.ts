// Create by zhoufeng
// Description: 上传本地版本到服务器

import { NodeSSH } from "node-ssh";

async function upload() {
    // 连接服务器
    const ssh = new NodeSSH();
    await ssh.connect({
        host: "piggy365.da.app",
        port: 60022,
        username: "zhoufeng",
        password: "int i=0;",
    });
    console.log("服务器连接成功");

    // 复制本地目录到远程服务器
    const localPath = "./src";
    const remotePath = "pig-home";
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
