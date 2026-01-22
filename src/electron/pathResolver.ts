import { isDev } from "./util.js"
import path from "path"
import { app } from "electron"

export function getPreloadPath() {
    // 开发环境：从项目根目录加载
    // 生产环境：从 app.asar 内的 dist-electron/electron 加载
    const basePath = isDev() ? process.cwd() : app.getAppPath();
    return path.join(basePath, 'dist-electron', 'electron', 'preload.cjs');
}

export function getUIPath() {
    // 开发环境：使用开发服务器 URL（在 main.ts 中处理）
    // 生产环境：从 app.asar 内的 dist-react 加载
    return path.join(app.getAppPath(), 'dist-react', 'index.html');
}

export function getIconPath() {
    // 开发环境直接使用项目根目录，打包环境使用 resources 目录
    if (isDev()) {
        // 开发环境：从项目根目录获取
        return path.join(process.cwd(), 'templateIcon.ico');
    }
    // 打包环境：图标文件在 resources 目录
    return path.join(process.resourcesPath, 'templateIcon.ico');
}