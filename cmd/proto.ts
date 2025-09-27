import path from "node:path";
import fs from "node:fs";

const Tag = "\n---通讯协议更新---\n";

async function update() {
    // 复制pay-vue同级目录下的pay-server/src/@types/net.d.ts到pay-vue/types/net.d.ts
    const srcPath = path.join(
        __dirname,
        "../../manor_rust/src/protocol/proto.d.ts",
    );
    const targetPath = path.join(__dirname, "../src/@types/net.d.ts");
    fs.copyFileSync(srcPath, targetPath);
    console.log(Tag, "更新协议成功！");
}

update().catch((e) => console.error(Tag, "更新协议失败：", e));
