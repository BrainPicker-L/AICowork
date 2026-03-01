/**
 * 系统资源监控
 * 使用 Node.js 原生模块，移除 os-utils 依赖以减小打包体积
 */

import fs from "fs"
import os from "os"
import { BrowserWindow } from "electron";
import { ipcWebContentsSend } from "./util.js";
import { log } from "./logger.js";

// 优化：增加轮询间隔到 2 秒，减少 CPU 消耗
const POLLING_INTERVAL = 2000;

// CPU 使用率计算辅助变量
const prevCpuInfo = os.cpus();
let prevIdleTime = 0;
let prevTotalTime = 0;

let pollingIntervalId: ReturnType<typeof setInterval> | null = null;
let isWindowVisible = true;

export function pollResources(mainWindow: BrowserWindow): void {
    log.info(`Starting resource polling (interval: ${POLLING_INTERVAL}ms)`);

    // 监听窗口可见性变化
    mainWindow.on('blur', () => {
        isWindowVisible = false;
        log.debug('Window lost focus, polling continues but less critical');
    });

    mainWindow.on('focus', () => {
        isWindowVisible = true;
        log.debug('Window gained focus');
    });

    pollingIntervalId = setInterval(async () => {
        if (mainWindow.isDestroyed()) {
            log.info('Window destroyed, stopping polling');
            stopPolling();
            return;
        }

        try {
            const startTime = Date.now();
            const cpuUsage = await getCPUUsage();
            const storageData = getStorageData();
            const ramUsage = getRamUsage();
            const duration = Date.now() - startTime;

            // 性能日志
            if (duration > 100) {
                log.warn(`Resource polling took ${duration}ms, considered slow`);
            }

            if (mainWindow.isDestroyed()) {
                stopPolling();
                return;
            }

            ipcWebContentsSend("statistics", mainWindow.webContents, { cpuUsage, ramUsage, storageData: storageData.usage });
        } catch (error) {
            log.error('Error during resource polling', error);
        }
    }, POLLING_INTERVAL);

    log.info('Resource polling started');
}

export function stopPolling(): void {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
        log.info('Resource polling stopped');
    }
}

export function getStaticData() {
    const totalStorage = getStorageData().total;
    const cpuModel = os.cpus()[0].model;
    // 使用 os.totalmem() 获取总内存（字节），转换为 GB
    const totalMemoryGB = Math.floor(os.totalmem() / (1024 * 1024 * 1024));

    return {
        totalStorage,
        cpuModel,
        totalMemoryGB,
        platform: process.platform,
    }
}

/**
 * 获取 CPU 使用率（百分比）
 * 使用 Node.js 原生 os.cpus() 计算
 */
function getCPUUsage(): Promise<number> {
    return new Promise(resolve => {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                const time = (cpu.times as Record<string, number>)[type];
                totalTick += time;
            }
            totalIdle += cpu.times.idle;
        });

        // 首次调用，初始化并返回 0
        if (prevTotalTime === 0) {
            prevIdleTime = totalIdle;
            prevTotalTime = totalTick;
            resolve(0);
            return;
        }

        // 计算差值
        const idleDiff = totalIdle - prevIdleTime;
        const totalDiff = totalTick - prevTotalTime;

        // 更新上一次的值
        prevIdleTime = totalIdle;
        prevTotalTime = totalTick;

        // 计算 CPU 使用率
        const usage = 100 - (100 * idleDiff / totalDiff);
        resolve(Math.max(0, Math.min(100, usage)));
    });
}

/**
 * 获取内存使用率（百分比）
 * 使用 Node.js 原生 os 模块
 */
function getRamUsage(): number {
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    return 1 - (freeMem / totalMem);
}

function getStorageData() {
    const stats = fs.statfsSync(process.platform === 'win32' ? 'C://' : '/');
    const total = stats.bsize * stats.blocks;
    const free = stats.bsize * stats.bfree;

    return {
        total: Math.floor(total / 1_000_000_000),
        usage: 1 - free / total
    }
}


