/**
 * 会话恢复区域
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SessionInfo } from "../../../electron.d";
import { useAppStore } from "../../../store/useAppStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

/**
 * 时间格式化工具函数
 * 将时间戳转换为相对时间字符串（如"2小时前"、"1天前"）
 */
function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	if (seconds < 60) {
		return "刚刚";
	} else if (minutes < 60) {
		return `${minutes}分钟前`;
	} else if (hours < 24) {
		return `${hours}小时前`;
	} else if (days < 30) {
		return `${days}天前`;
	} else if (months < 12) {
		return `${months}个月前`;
	} else {
		return `${years}年前`;
	}
}

/**
 * 格式化完整日期时间
 * 用于显示绝对时间（如"2026-01-21 14:30"）
 */
function formatFullDateTime(timestamp: number): string {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");

	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 截断会话 ID，只显示前 12 个字符
 */
function truncateSessionId(sessionId: string): string {
	return sessionId.length > 12 ? `${sessionId.slice(0, 12)}...` : sessionId;
}

export function RecoverySection() {
	const { t } = useTranslation();
	const [sessions, setSessions] = useState<SessionInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [recovering, setRecovering] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
	const [sessionHistory, setSessionHistory] = useState<any>(null);
	const [loadingHistory, setLoadingHistory] = useState(false);

	// 获取状态管理方法
	const setActiveSessionId = useAppStore((state) => state.setActiveSessionId);
	const setCurrentPage = useAppStore((state) => state.setCurrentPage);

	// 加载会话列表
	const loadSessions = async () => {
		setLoading(true);
		setError(null);
		try {
			const sessionsList = await window.electron.getSessionsList();
			// 按更新时间降序排序
			sessionsList.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
			setSessions(sessionsList);
		} catch (err) {
			console.error("Failed to load sessions:", err);
			setError("加载会话列表失败");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadSessions();
	}, []);

	// 自动清除成功提示
	useEffect(() => {
		if (success) {
			const timer = setTimeout(() => setSuccess(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [success]);

	// 恢复会话
	const handleRecoverSession = async (sessionId: string) => {
		setRecovering(sessionId);
		setError(null);

		try {
			const result = await window.electron.recoverSession(sessionId);
			if (result.success) {
				// 显示成功提示
				setSuccess("会话恢复成功");

				// 切换到恢复的会话
				setActiveSessionId(sessionId);
				// 切换到主页面
				setCurrentPage('main');
			} else {
				setError(result.error || "恢复会话失败");
			}
		} catch (err) {
			setError("恢复会话失败");
		} finally {
			setRecovering(null);
		}
	};

	// 删除会话
	const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
		if (!confirm(`确定要删除会话 "${sessionTitle}" 吗？此操作不可撤销。`)) {
			return;
		}

		setError(null);

		try {
			const result = await window.electron.deleteSession(sessionId);
			if (result.success) {
				// 重新加载会话列表
				await loadSessions();
				// 清除选中状态
				if (selectedSession?.sessionId === sessionId) {
					setSelectedSession(null);
					setSessionHistory(null);
				}
			} else {
				setError(result.error || "删除会话失败");
			}
		} catch (err) {
			setError("删除会话失败");
		}
	};

	// 选择会话查看历史
	const handleSelectSession = async (session: SessionInfo) => {
		setSelectedSession(session);
		setLoadingHistory(true);
		try {
			const history = await window.electron.getSessionHistory(session.sessionId);
			setSessionHistory(history);
		} catch (err) {
			console.error("Failed to load session history:", err);
			setSessionHistory(null);
		} finally {
			setLoadingHistory(false);
		}
	};

	return (
		<TooltipProvider>
		<section className="space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-ink-900">{t("recovery.title")}</h1>
					<p className="mt-2 text-sm text-muted">
						{t("recovery.description")}
					</p>
				</div>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={loadSessions}
							className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
							disabled={loading}
						>
							{loading ? t("recovery.loading") || "加载中..." : t("recovery.refresh") || "刷新列表"}
						</button>
					</TooltipTrigger>
					<TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
						{loading ? "加载中..." : "刷新会话列表"}
					</TooltipContent>
				</Tooltip>
			</header>

			{error && (
				<div className="rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
					{error}
				</div>
			)}

			{success && (
				<div className="rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
					{success}
				</div>
			)}

			{loading ? (
				<div className="flex items-center justify-center py-8">
					<svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
				</div>
			) : sessions.length === 0 ? (
				<div className="text-center py-8">
					<p className="text-sm text-muted">暂无历史会话</p>
					<p className="text-xs text-muted mt-2">
						开始使用后会自动记录会话历史
					</p>
				</div>
			) : (
				<div className="flex gap-4">
					{/* 左侧会话列表 */}
					<div className="flex-1 space-y-3">
						{sessions.map((session) => (
							<div
								key={session.sessionId}
								className={`p-4 rounded-xl border cursor-pointer transition-colors ${
									selectedSession?.sessionId === session.sessionId
										? 'border-accent bg-accent/5'
										: 'border-ink-900/10 bg-surface hover:border-ink-900/20'
								}`}
								onClick={() => handleSelectSession(session)}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1 min-w-0">
										<h3 className="text-sm font-medium text-ink-900 truncate" title={session.title}>
											{session.title || "未命名会话"}
										</h3>
										<p className="mt-1 text-xs text-muted" title={session.sessionId}>
											会话 ID: {truncateSessionId(session.sessionId)}
										</p>
										<p className="text-xs text-muted" title={formatFullDateTime(session.updatedAt)}>
											更新于: {formatRelativeTime(session.updatedAt)}
										</p>
										{session.messageCount && (
											<p className="text-xs text-muted">
												消息数: {session.messageCount}
											</p>
										)}
									</div>
									<div className="flex items-center gap-2">
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
														onClick={(e) => { e.stopPropagation(); handleRecoverSession(session.sessionId); }}
														disabled={recovering === session.sessionId}
													>
														{recovering === session.sessionId ? "恢复中..." : t("recovery.recover")}
													</button>
												</TooltipTrigger>
												<TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
													{recovering === session.sessionId ? "恢复中..." : "恢复此会话"}
												</TooltipContent>
											</Tooltip>
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														className="text-xs text-muted hover:text-error p-1 transition-colors cursor-pointer"
														onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.sessionId, session.title || "未命名会话"); }}
													>
														<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
															<path d="M18 6L6 18M6 6l12 12" />
														</svg>
													</button>
												</TooltipTrigger>
												<TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
													删除会话
												</TooltipContent>
											</Tooltip>
										</div>
								</div>
							</div>
						))}
					</div>

					{/* 右侧预览面板 */}
					<div className="w-80 rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
						{selectedSession ? (
							<div className="space-y-4">
								<div>
									<h3 className="text-sm font-medium text-ink-900 mb-2">会话详情</h3>
									<p className="text-xs text-ink-700 break-words">{selectedSession.title || "未命名会话"}</p>
								</div>
								<div>
									<p className="text-xs text-muted mb-1">会话 ID</p>
									<p className="text-xs font-mono text-ink-700 break-all">{selectedSession.sessionId}</p>
								</div>
								<div>
									<p className="text-xs text-muted mb-1">创建时间</p>
									<p className="text-xs text-ink-700">{formatFullDateTime(selectedSession.createdAt || selectedSession.updatedAt)}</p>
								</div>
								<div>
									<p className="text-xs text-muted mb-1">更新时间</p>
									<p className="text-xs text-ink-700">{formatFullDateTime(selectedSession.updatedAt)}</p>
								</div>
								{selectedSession.cwd && (
									<div>
										<p className="text-xs text-muted mb-1">工作目录</p>
										<p className="text-xs font-mono text-ink-700 break-all">{selectedSession.cwd}</p>
									</div>
								)}
								<div>
									<p className="text-xs text-muted mb-1">消息数量</p>
									<p className="text-xs text-ink-700">{selectedSession.messageCount || 'N/A'}</p>
								</div>

								{/* 会话历史预览 */}
								<div>
									<p className="text-xs text-muted mb-2">消息预览</p>
									<div className="max-h-48 overflow-y-auto rounded-lg bg-ink-900/5 p-2">
										{loadingHistory ? (
											<div className="flex items-center justify-center py-4">
												<svg className="w-4 h-4 animate-spin text-muted" viewBox="0 0 24 24" fill="none">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
												</svg>
											</div>
										) : sessionHistory && Array.isArray(sessionHistory.messages) && sessionHistory.messages.length > 0 ? (
											<div className="space-y-2">
												{sessionHistory.messages.slice(-5).map((msg: any, idx: number) => (
													<div key={idx} className="text-xs p-2 rounded bg-surface">
														<p className="font-medium text-ink-900">{msg.role || 'unknown'}</p>
														<p className="text-muted-light mt-1 line-clamp-2">
															{typeof msg.content === 'string' ? msg.content.slice(0, 100) : (msg.content ? JSON.stringify(msg.content).slice(0, 100) : 'No content')}
														</p>
													</div>
												))}
											</div>
										) : (
											<p className="text-xs text-muted text-center py-4">无历史记录</p>
										)}
									</div>
								</div>
							</div>
						) : (
							<div className="text-center py-8">
								<p className="text-sm text-muted">选择一个会话查看详情</p>
							</div>
						)}
					</div>
				</div>
			)}

			<aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
				<p className="text-xs text-muted">
					<strong>提示：</strong>{t("recovery.hint")}
					{t("recovery.hintWithCommand")}
					<code className="px-1 py-0.5 rounded bg-ink-900/5">claude --resume &lt;session-id&gt;</code>
				</p>
			</aside>
		</section>
		</TooltipProvider>
	);
}
