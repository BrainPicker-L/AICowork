/**
 * 打包前将 node_modules 下所有符号链接替换为实体目录拷贝，避免 asar 内 ESM 解析失败（ERR_MODULE_NOT_FOUND）。
 *
 * 根因：pnpm 的 node_modules 大量使用符号链接指向 .pnpm store，electron-builder 打进 asar 后
 * Node 在 asar 内解析 require/import 时无法正确跟随这些链接，导致所有「仅以链接形式存在」的
 * 传递依赖（如 form-data、ajv、proxy-from-env）都会报错。逐包补 direct dependency 无法穷尽。
 *
 * 做法：遍历 node_modules 第一层，对每个符号链接执行「删链接 + 按链接跟随拷贝目标目录」，
 * 拷贝时递归跟随子路径中的符号链接，使整棵子树变为实体文件，再交给 electron-builder 打包。
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const nm = path.resolve(root, "node_modules");

if (!fs.existsSync(nm)) {
  console.log("[copy-pnpm-deps] node_modules not found, skip.");
  process.exit(0);
}

/**
 * 递归拷贝 src 到 dest，遇到符号链接时拷贝链接目标内容（不保留链接）
 */
function copyFollowingSymlinks(src, dest) {
  const stat = fs.lstatSync(src);
  if (stat.isSymbolicLink()) {
    const target = fs.realpathSync(src);
    const tStat = fs.statSync(target);
    if (tStat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const name of fs.readdirSync(target)) {
        copyFollowingSymlinks(path.join(target, name), path.join(dest, name));
      }
    } else {
      fs.copyFileSync(target, dest);
    }
    return;
  }
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyFollowingSymlinks(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.copyFileSync(src, dest);
}

let count = 0;
for (const name of fs.readdirSync(nm)) {
  if (name === ".pnpm" || name === ".modules.yaml") continue;
  const linkPath = path.join(nm, name);
  let stat;
  try {
    stat = fs.lstatSync(linkPath);
  } catch (e) {
    continue;
  }
  if (!stat.isSymbolicLink()) continue;
  const target = fs.realpathSync(linkPath);
  try {
    fs.unlinkSync(linkPath);
    copyFollowingSymlinks(target, linkPath);
    count++;
    console.log("[copy-pnpm-deps] Replaced symlink with real copy:", name);
  } catch (e) {
    console.warn("[copy-pnpm-deps]", name, e.message);
    process.exitCode = 1;
  }
}

if (count === 0) {
  console.log("[copy-pnpm-deps] No symlinks in node_modules (e.g. npm or already flattened), skip.");
} else {
  console.log("[copy-pnpm-deps] Done. Replaced", count, "symlink(s).");
}
