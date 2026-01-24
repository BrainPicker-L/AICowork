/**
 * Permissions 设置区域
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { PermissionsStore } from "../../../electron.d";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

type ViewMode = 'list' | 'create';

// 可用的工具列表
const AVAILABLE_TOOLS = [
	{ name: 'Bash', description: '执行 bash 命令' },
	{ name: 'Read', description: '读取文件内容' },
	{ name: 'Write', description: '写入文件内容' },
	{ name: 'Edit', description: '编辑文件' },
	{ name: 'Glob', description: '文件模式匹配' },
	{ name: 'Grep', description: '搜索文件内容' },
	{ name: 'Task', description: '启动子代理' },
	{ name: 'AskUserQuestion', description: '向用户提问' },
	{ name: 'WebSearch', description: '网络搜索' },
	{ name: 'mcp__4_5v_mcp__analyze_image', description: '图像分析' },
	{ name: 'mcp__web_reader__webReader', description: '网页阅读器' },
];

export function PermissionsSection() {
	const { t } = useTranslation();
	const [viewMode, setViewMode] = useState<ViewMode>('list');
	const [permissions, setPermissions] = useState<PermissionsStore>({ allowedTools: [], customRules: [] });
	const [loading, setLoading] = useState(false);

	// 创建规则表单状态
	const [selectedTool, setSelectedTool] = useState('');
	const [isAllowed, setIsAllowed] = useState(true);
	const [description, setDescription] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// 加载权限配置
	const loadPermissions = async () => {
		setLoading(true);
		try {
			const config = await window.electron.getPermissionsConfig();
			setPermissions(config);
		} catch (err) {
			console.error('Failed to load permissions:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadPermissions();
	}, []);

	// 自动清除成功提示
	useEffect(() => {
		if (success) {
			const timer = setTimeout(() => setSuccess(false), 2000);
			return () => clearTimeout(timer);
		}
	}, [success]);

	// 创建权限规则
	const handleCreateRule = async () => {
		if (!selectedTool) {
			setError('请选择工具');
			return;
		}
		// 检查规则唯一性
		const ruleExists = permissions.customRules.some(r => r.tool === selectedTool);
		if (ruleExists) {
			setError('该工具的权限规则已存在');
			return;
		}

		setError(null);
		setSaving(true);

		try {
			const result = await window.electron.savePermissionRule({
				tool: selectedTool,
				allowed: isAllowed,
				description: description || undefined,
			});

			if (result.success) {
				setSuccess(true);
				// 重置表单
				setSelectedTool('');
				setIsAllowed(true);
				setDescription('');
				// 重新加载列表
				await loadPermissions();
			} else {
				setError(result.error || '保存规则失败');
			}
		} catch (err) {
			setError('保存规则失败');
		} finally {
			setSaving(false);
		}
	};

	// 删除权限规则
	const handleDeleteRule = async (toolName: string) => {
		if (!confirm(`确定要删除工具 "${toolName}" 的权限规则吗？`)) {
			return;
		}

		try {
			const result = await window.electron.deletePermissionRule(toolName);
			if (result.success) {
				await loadPermissions();
			} else {
				setError(result.error || '删除规则失败');
			}
		} catch (err) {
			setError('删除规则失败');
		}
	};

	return (
		<TooltipProvider>
		<section className="space-y-6">
			<header>
			<h1 className="text-2xl font-semibold text-ink-900">{t("permissions.title")}</h1>
			<p className="mt-2 text-sm text-muted">
				{t("permissions.description")}
			</p>
		</header>

			{viewMode === 'create' ? (
				// 创建规则表单 - 左右50%分栏
				<div className="flex gap-6">
					{/* 左侧：表单编辑区 - 占50% */}
					<div className="w-1/2 space-y-4">
						<div className="grid gap-1.5">
							<label className="text-xs font-medium text-muted">选择工具</label>
							<select
								className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
								value={selectedTool}
								onChange={(e) => setSelectedTool(e.target.value)}
							>
								<option value="">请选择工具...</option>
								{AVAILABLE_TOOLS.map((tool) => (
									<option key={tool.name} value={tool.name}>
										{tool.name} - {tool.description}
									</option>
								))}
							</select>
							<p className="text-xs text-muted-light">选择要配置权限的工具</p>
						</div>

						<div className="grid gap-1.5">
							<label className="text-xs font-medium text-muted">权限设置</label>
							<div className="flex gap-4">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="permission"
										checked={isAllowed}
										onChange={() => setIsAllowed(true)}
										className="w-4 h-4 text-accent focus:ring-accent/20"
									/>
									<span className="text-sm text-ink-700">允许</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="permission"
										checked={!isAllowed}
										onChange={() => setIsAllowed(false)}
										className="w-4 h-4 text-accent focus:ring-accent/20"
									/>
									<span className="text-sm text-ink-700">拒绝</span>
								</label>
							</div>
							<p className="text-xs text-muted-light">设置工具是否需要用户确认</p>
						</div>

						<div className="grid gap-1.5">
							<label className="text-xs font-medium text-muted">描述（可选）</label>
							<input
								type="text"
								className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
								placeholder="规则用途说明..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>

						{error && (
							<div className="rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
								{error}
							</div>
						)}

						{success && (
							<div className="rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
								规则保存成功
							</div>
						)}

						<div className="flex gap-3">
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
										onClick={handleCreateRule}
										disabled={saving}
									>
										{saving ? '保存中...' : '保存规则'}
									</button>
								</TooltipTrigger>
								<TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
									{saving ? '保存中...' : '保存权限规则'}
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors cursor-pointer"
										onClick={() => setViewMode('list')}
									>
										取消
									</button>
								</TooltipTrigger>
								<TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
									取消创建权限规则
								</TooltipContent>
							</Tooltip>
						</div>
					</div>

					{/* 右侧：配置预览和说明 - 占50% */}
					<div className="w-1/2 space-y-4">
						<h3 className="text-lg font-medium text-ink-900">配置预览</h3>

						{/* JSON配置预览 */}
						<div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
							<h4 className="text-xs font-medium text-muted mb-2">JSON 配置</h4>
							<pre className="text-xs bg-surface rounded-lg p-3 overflow-x-auto text-muted font-mono leading-relaxed">
								{JSON.stringify({
									tool: selectedTool || 'tool-name',
									allowed: isAllowed,
									description: description || undefined,
								}, null, 2)}
							</pre>
						</div>

						{/* 权限说明 */}
						<div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
							<h4 className="text-xs font-medium text-muted mb-2">权限说明</h4>
							<div className="text-xs text-ink-700 space-y-2 leading-relaxed">
								<div>
									<strong className="text-ink-900">工具名称：</strong>要配置的工具
								</div>
								<div>
									<strong className="text-ink-900">权限设置：</strong>
									{isAllowed ? ' 允许' : ' 拒绝'}使用该工具
								</div>
								<div>
									<strong className="text-ink-900">描述：</strong>规则用途说明
								</div>
								<div className="mt-3 pt-3 border-t border-ink-900/10">
									<p className="text-muted text-xs">配置保存位置：<code className="px-1 py-0.5 rounded bg-ink-900/5">~/.claude/settings.json</code></p>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				// 规则列表
				<>
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
						</div>
					) : permissions.customRules.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-sm text-muted">暂无权限规则</p>
							<p className="text-xs text-muted mt-2">
								点击上方"添加权限规则"按钮开始
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{permissions.customRules.map((rule) => (
								<div key={rule.tool} className="p-4 rounded-xl border border-ink-900/10 bg-surface">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<h3 className="text-sm font-medium text-ink-900">{rule.tool}</h3>
												<span className={`text-xs px-2 py-0.5 rounded ${
													rule.allowed
														? 'bg-success/20 text-success'
														: 'bg-error/20 text-error'
												}`}>
													{rule.allowed ? '允许' : '拒绝'}
												</span>
											</div>
											{rule.description && (
												<p className="mt-1 text-xs text-muted">{rule.description}</p>
											)}
										</div>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													className="text-xs text-muted hover:text-error p-1 cursor-pointer"
													onClick={() => handleDeleteRule(rule.tool)}
												>
													<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
														<path d="M18 6L6 18M6 6l12 12" />
													</svg>
												</button>
											</TooltipTrigger>
											<TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
												删除权限规则
											</TooltipContent>
										</Tooltip>
									</div>
								</div>
							))}
						</div>
					)}

					<div className="flex gap-3">
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className="flex-1 py-3 rounded-xl bg-accent text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors cursor-pointer"
									onClick={() => setViewMode('create')}
								>
									添加权限规则
								</button>
							</TooltipTrigger>
							<TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
								创建新的权限规则
							</TooltipContent>
						</Tooltip>
					</div>

					<aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
						<p className="text-xs text-muted">
							<strong>{t("permissions.securityHint")}</strong>
						</p>
					</aside>
				</>
			)}
		</section>
		</TooltipProvider>
	);
}
