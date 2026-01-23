/**
 * Memory 管理区域 - 持久化记忆系统
 */

import { useState, useEffect } from "react";
import { BrainIcon } from "../../../components/BrainIcon";

// 记忆文档接口
interface MemoryDocument {
  id: string;
  title: string;
  text: string;
  label: string;
  score?: number;
  created_at?: number;
  tags?: string[];
}

// 记忆分类
const MEMORY_CATEGORIES = [
  { id: 'project', name: '项目相关', icon: '📁' },
  { id: 'preference', name: '用户偏好', icon: '⚙️' },
  { id: 'technical', name: '技术记录', icon: '💡' },
  { id: 'context', name: '上下文信息', icon: '📝' },
  { id: 'conversation', name: '对话摘要', icon: '💬' },
  { id: 'custom', name: '自定义', icon: '🏷️' },
];

// 统计信息接口
interface MemoryStats {
  frame_count: number;
  size_bytes: number;
  has_lex_index: boolean;
  has_vec_index: boolean;
}

export function MemorySection() {
  const [documents, setDocuments] = useState<MemoryDocument[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<MemoryDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 新建文档表单状态
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newLabel, setNewLabel] = useState('custom');
  const [isCustomLabel, setIsCustomLabel] = useState(false);
  const [customLabelValue, setCustomLabelValue] = useState('');
  const [saving, setSaving] = useState(false);

  // 问答状态
  const [isAsking, setIsAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);

  // 标签状态
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  // 设置面板标签创建状态（独立于创建表单）
  const [showSettingsTagInput, setShowSettingsTagInput] = useState(false);
  const [newSettingsTag, setNewSettingsTag] = useState('');

  // 配置状态
  const [config, setConfig] = useState<{
    enabled: boolean;
    autoStore: boolean;
    autoStoreCategories: string[];
    searchMode: 'lex' | 'sem' | 'auto';
    defaultK: number;
    availableTags?: string[];
  }>({
    enabled: true,
    autoStore: false,
    autoStoreCategories: ['project', 'technical'],
    searchMode: 'lex',
    defaultK: 6,
    availableTags: [],
  });
  const [showSettings, setShowSettings] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // 计算图标的颜色
  const getMemoryIconColor = (): 'error' | 'success' | 'info' | 'muted' => {
    if (configError) return 'error';
    if (configSaving) return 'info';
    if (config.enabled) return 'success';
    return 'muted';
  };

  const getAutoStoreIconColor = (): 'error' | 'success' | 'info' | 'muted' => {
    if (configError) return 'error';
    if (configSaving) return 'info';
    if (config.autoStore) return 'success';
    return 'muted';
  };

  // 编辑文档状态
  const [editingDoc, setEditingDoc] = useState<MemoryDocument | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editLabel, setEditLabel] = useState('custom');
  const [editIsCustomLabel, setEditIsCustomLabel] = useState(false);
  const [editCustomLabelValue, setEditCustomLabelValue] = useState('');
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // 编辑模式下的标签创建状态
  const [showEditTagInput, setShowEditTagInput] = useState(false);
  const [newEditTag, setNewEditTag] = useState('');

  // 多选状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // 收集所有使用过的自定义分类
  const [customCategories, setCustomCategories] = useState<Set<string>>(new Set());

  // 自动存储分类创建状态
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // 加载统计信息和文档列表
  const loadData = async () => {
    setLoading(true);
    try {
      // 获取统计信息
      const statsResult = await window.electron.memoryGetStats();
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }

      // 获取最近的文档（通过时间线）
      const timelineResult = await window.electron.memoryGetTimeline({ limit: 20, reverse: true });
      if (timelineResult.success && timelineResult.entries) {
        const docs: MemoryDocument[] = timelineResult.entries.map((entry: any) => {
          // 从 entry.doc 中获取实际文档数据
          const doc = entry.doc || entry;
          return {
            id: entry.frame_id || doc.id,
            title: doc.title || '无标题',
            text: doc.text || '',
            label: doc.label || 'custom',
            created_at: entry.timestamp || doc.created_at,
            tags: doc.tags || doc.metadata?.tags || [],
          };
        });
        setDocuments(docs);

        // 提取所有使用过的自定义分类
        const predefinedIds = MEMORY_CATEGORIES.map(c => c.id);
        const customLabels = new Set<string>();
        docs.forEach(doc => {
          if (doc.label && !predefinedIds.includes(doc.label)) {
            customLabels.add(doc.label);
          }
        });
        setCustomCategories(customLabels);
      }
    } catch (err) {
      console.error('Failed to load memory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadConfig();
  }, []);

  // 加载配置
  const loadConfig = async () => {
    try {
      const result = await window.electron.memoryGetConfig();
      if (result.success && result.config) {
        setConfig(result.config as any);
        // 从配置中加载可用标签
        if (result.config.availableTags && Array.isArray(result.config.availableTags)) {
          setAvailableTags(result.config.availableTags);
        }
      }
    } catch (err) {
      console.error('Failed to load memory config:', err);
    }
  };

  // 保存可用标签到配置
  const saveAvailableTags = async (tags: string[]) => {
    try {
      await window.electron.memorySetConfig({
        ...config,
        availableTags: tags,
      });
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to save available tags:', err);
    }
  };

  // 添加新标签（创建表单中使用）
  const handleAddTag = async () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) return;
    if (availableTags.includes(trimmedTag)) {
      alert('标签已存在');
      return;
    }

    const newTags = [...availableTags, trimmedTag];
    await saveAvailableTags(newTags);
    setNewTag('');
    setShowTagInput(false);
  };

  // 添加新标签（设置面板中使用）
  const handleAddSettingsTag = async () => {
    const trimmedTag = newSettingsTag.trim();
    if (!trimmedTag) return;
    if (availableTags.includes(trimmedTag)) {
      alert('标签已存在');
      return;
    }

    const newTags = [...availableTags, trimmedTag];
    await saveAvailableTags(newTags);
    setNewSettingsTag('');
    setShowSettingsTagInput(false);
  };

  // 添加新标签（编辑表单中使用）
  const handleAddEditTag = async () => {
    const trimmedTag = newEditTag.trim();
    if (!trimmedTag) return;
    if (availableTags.includes(trimmedTag)) {
      alert('标签已存在');
      return;
    }

    const newTags = [...availableTags, trimmedTag];
    await saveAvailableTags(newTags);
    // 自动将新标签添加到当前选中
    setEditSelectedTags(prev => [...prev, trimmedTag]);
    setNewEditTag('');
    setShowEditTagInput(false);
  };

  // 删除标签
  const handleDeleteTag = async (tag: string) => {
    if (!confirm(`确定要删除标签 "${tag}" 吗？此操作不会影响已使用该标签的记忆。`)) {
      return;
    }
    const newTags = availableTags.filter(t => t !== tag);
    await saveAvailableTags(newTags);
  };

  // 切换标签选中状态（用于创建/编辑时选择标签）
  const toggleTagSelection = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 切换编辑时的标签选中状态
  const toggleEditTagSelection = (tag: string) => {
    setEditSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 创建新的自定义分类
  const handleAddCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    // 检查是否已存在（预设分类或自定义分类）
    const predefinedIds = MEMORY_CATEGORIES.map(c => c.id);
    if (predefinedIds.includes(trimmedName) || customCategories.has(trimmedName)) {
      alert('分类已存在');
      return;
    }

    // 添加到自定义分类集合
    setCustomCategories(prev => new Set(prev).add(trimmedName));

    // 自动添加到自动存储分类
    const newCategories = [...config.autoStoreCategories, trimmedName];
    saveConfig({ ...config, autoStoreCategories: newCategories });

    setNewCategoryName('');
    setShowCategoryInput(false);
  };

  // 保存配置
  const saveConfig = async (newConfig: Partial<typeof config>) => {
    setConfigSaving(true);
    setConfigError(null);
    try {
      const result = await window.electron.memorySetConfig(newConfig);
      if (result.success) {
        setConfig((prev) => ({ ...prev, ...newConfig }));
      } else {
        setConfigError(result.error || '保存配置失败');
        alert(result.error || '保存配置失败');
      }
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : '保存配置失败');
      console.error('Failed to save memory config:', err);
      alert('保存配置失败');
    } finally {
      setConfigSaving(false);
    }
  };

  // 创建记忆文档
  const handleCreateDocument = async () => {
    if (!newTitle.trim() || !newText.trim()) {
      return;
    }

    // 确定最终使用的标签值
    let finalLabel = newLabel;
    if (newLabel === 'custom' && isCustomLabel && customLabelValue.trim()) {
      finalLabel = customLabelValue.trim();
    }

    setSaving(true);
    try {
      const result = await window.electron.memoryPutDocument({
        title: newTitle.trim(),
        text: newText.trim(),
        label: finalLabel,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });

      if (result.success) {
        // 重置表单
        setNewTitle('');
        setNewText('');
        setNewLabel('custom');
        setIsCustomLabel(false);
        setCustomLabelValue('');
        setSelectedTags([]);
        setIsCreating(false);
        // 重新加载数据
        loadData();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (err) {
      console.error('Failed to create memory:', err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 搜索文档
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await window.electron.memoryFindDocuments(searchQuery, {
        mode: 'lex',
        k: 10,
      });

      if (result.success && result.results) {
        const docs: MemoryDocument[] = result.results.hits.map((hit: any) => ({
          id: hit.id,
          title: hit.doc.title || '无标题',
          text: hit.doc.text || '',
          label: hit.doc.label || 'custom',
          score: hit.score,
          tags: hit.doc.tags || hit.doc.metadata?.tags || [],
        }));
        setSearchResults(docs);
      } else {
        alert(result.error || '搜索失败');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Failed to search:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 问答查询
  const handleAskQuestion = async () => {
    if (!question.trim()) {
      return;
    }

    setAskingQuestion(true);
    setAnswer('');
    try {
      const result = await window.electron.memoryAskQuestion(question, {
        mode: 'lex',
        k: 6,
        contextOnly: false,
      });

      if (result.success) {
        setAnswer(result.answer || result.context || '无相关记忆');
      } else {
        setAnswer(result.error || '查询失败');
      }
    } catch (err) {
      console.error('Failed to ask question:', err);
      setAnswer('查询失败');
    } finally {
      setAskingQuestion(false);
    }
  };

  // 清空所有记忆
  const handleClearAll = async () => {
    if (!confirm('确定要清空所有记忆吗？此操作不可恢复！')) {
      return;
    }

    try {
      const result = await window.electron.memoryClear();
      if (result.success) {
        setDocuments([]);
        setSearchResults([]);
        setStats(null);
        alert('记忆已清空');
      } else {
        alert(result.error || '清空失败');
      }
    } catch (err) {
      console.error('Failed to clear memory:', err);
      alert('清空失败');
    }
  };

  // 编辑文档
  const handleEditDocument = (doc: MemoryDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditText(doc.text);

    // 处理标签 - 检查是否是自定义标签
    const isPredefined = MEMORY_CATEGORIES.some(c => c.id === doc.label);
    if (isPredefined) {
      setEditLabel(doc.label);
      setEditIsCustomLabel(false);
      setEditCustomLabelValue('');
    } else {
      setEditLabel('custom');
      setEditIsCustomLabel(true);
      setEditCustomLabelValue(doc.label);
    }

    // 加载标签（从 metadata 中）
    setEditSelectedTags(doc.tags || []);

    setIsCreating(false);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingDoc || !editTitle.trim()) return;

    // 确定最终使用的标签值
    let finalLabel = editLabel;
    if (editLabel === 'custom' && editIsCustomLabel && editCustomLabelValue.trim()) {
      finalLabel = editCustomLabelValue.trim();
    }

    setEditSaving(true);
    try {
      const result = await window.electron.memoryUpdateDocument(editingDoc.id, {
        title: editTitle.trim(),
        text: editText.trim(),
        label: finalLabel,
        tags: editSelectedTags.length > 0 ? editSelectedTags : undefined,
      });

      if (result.success) {
        // 重新加载数据并重置编辑状态
        loadData();
        setEditingDoc(null);
        setShowEditTagInput(false);
        setNewEditTag('');
      } else {
        alert(result.error || '更新失败');
      }
    } catch (err) {
      console.error('Failed to update document:', err);
      alert('更新失败');
    } finally {
      setEditSaving(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingDoc(null);
    setEditTitle('');
    setEditText('');
    setEditLabel('custom');
    setEditIsCustomLabel(false);
    setEditCustomLabelValue('');
    setEditSelectedTags([]);
    setShowEditTagInput(false);
    setNewEditTag('');
  };

  // 删除文档
  const handleDeleteDocument = async (id: string, title: string) => {
    if (!confirm(`确定要删除记忆 "${title}" 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      const result = await window.electron.memoryDeleteDocument(id);
      if (result.success) {
        // 重新加载数据
        loadData();
      } else {
        alert(result.error || '删除失败');
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('删除失败');
    }
  };

  // 格式化文件大小
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 多选操作处理
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    const currentDocs = searchResults.length > 0 ? searchResults : documents;
    if (selectedIds.size === currentDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentDocs.map(d => d.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记忆吗？此操作不可恢复！`)) {
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        const result = await window.electron.memoryDeleteDocument(id);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      setSelectedIds(new Set());
      loadData();

      if (failCount > 0) {
        alert(`批量删除完成：成功 ${successCount} 条，失败 ${failCount} 条`);
      } else {
        alert(`成功删除 ${successCount} 条记忆`);
      }
    } catch (err) {
      console.error('Failed to batch delete:', err);
      alert('批量删除失败');
    }
  };

  const handleBatchExport = async () => {
    if (selectedIds.size === 0) return;

    const currentDocs = searchResults.length > 0 ? searchResults : documents;
    const selectedDocs = currentDocs.filter(d => selectedIds.has(d.id));

    // 导出为 JSON
    const exportData = selectedDocs.map(doc => ({
      title: doc.title,
      text: doc.text,
      label: doc.label,
      created_at: doc.created_at,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`已导出 ${selectedDocs.length} 条记忆`);
  };

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">AI 记忆系统</h1>
          <p className="mt-2 text-sm text-muted">
            持久化记忆、语义搜索和 RAG 问答功能
          </p>
        </div>
        {stats && (
          <div className="flex gap-4 text-xs text-muted">
            <span>文档: {stats.frame_count}</span>
            <span>大小: {formatBytes(stats.size_bytes)}</span>
            <span>词法索引: {stats.has_lex_index ? '✓' : '✗'}</span>
            <span>向量索引: {stats.has_vec_index ? '✓' : '✗'}</span>
          </div>
        )}
      </header>

      {/* 配置面板 */}
      <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-ink-900">记忆配置</h3>
          <button
            className="text-xs text-accent hover:text-accent-hover transition-colors"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? '隐藏' : '显示'}
          </button>
        </div>

        {showSettings && (
          <div className="space-y-4">
            {/* 基础配置 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <BrainIcon className="h-3.5 w-3.5" color={getMemoryIconColor()} />
                    <label className="text-xs font-medium text-ink-900">启用记忆功能</label>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.enabled ? 'bg-success/10 text-success' : 'bg-muted-light text-muted-light'}`}>
                      {config.enabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">启用后可使用记忆搜索、问答和手动存储功能</p>
                </div>
                <button
                  className={`w-10 h-5 rounded-full transition-colors ${config.enabled ? 'bg-accent' : 'bg-ink-900/20'}`}
                  onClick={() => saveConfig({ ...config, enabled: !config.enabled })}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-ink-900/10">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <BrainIcon className="h-3.5 w-3.5" color={getAutoStoreIconColor()} />
                    <label className="text-xs font-medium text-ink-900">自动存储记忆</label>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.autoStore ? 'bg-success/10 text-success' : 'bg-muted-light text-muted-light'}`}>
                      {config.autoStore ? '已启用' : '已禁用'}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">会话结束时 AI 自动分析并存储有价值的内容</p>
                </div>
                <button
                  className={`w-10 h-5 rounded-full transition-colors ${config.autoStore ? 'bg-accent' : 'bg-ink-900/20'}`}
                  onClick={() => saveConfig({ ...config, autoStore: !config.autoStore })}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.autoStore ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {/* 搜索模式 */}
            <div className="grid gap-1.5">
              <label className="text-xs text-muted">搜索模式</label>
              <select
                className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none"
                value={config.searchMode}
                onChange={(e) => saveConfig({ ...config, searchMode: e.target.value as 'lex' | 'sem' | 'auto' })}
              >
                <option value="lex">词法搜索 (BM25)</option>
                <option value="sem">语义搜索 (向量)</option>
                <option value="auto">自动混合</option>
              </select>
            </div>

            {/* 默认结果数 */}
            <div className="grid gap-1.5">
              <label className="text-xs text-muted">默认搜索结果数: {config.defaultK}</label>
              <input
                type="range"
                min="3"
                max="20"
                value={config.defaultK}
                onChange={(e) => saveConfig({ ...config, defaultK: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* 自动存储分类 */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted">自动存储分类</label>
                <button
                  className="text-xs text-accent hover:text-accent-hover"
                  onClick={() => setShowCategoryInput(!showCategoryInput)}
                >
                  {showCategoryInput ? '−' : '+ 新建分类'}
                </button>
              </div>

              {/* 新建分类输入框 */}
              {showCategoryInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="输入自定义分类名称..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCategory();
                      } else if (e.key === 'Escape') {
                        setShowCategoryInput(false);
                        setNewCategoryName('');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className="px-3 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
                    onClick={handleAddCategory}
                  >
                    添加
                  </button>
                </div>
              )}

              {/* 分类选择按钮 */}
              <div className="flex flex-wrap gap-2">
                {/* 预设分类 */}
                {MEMORY_CATEGORIES.filter(c => c.id !== 'custom').map(cat => (
                  <button
                    key={cat.id}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      config.autoStoreCategories.includes(cat.id)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface text-ink-700 border-ink-900/10 hover:border-accent/50'
                    }`}
                    onClick={() => {
                      const newCategories = config.autoStoreCategories.includes(cat.id)
                        ? config.autoStoreCategories.filter(x => x !== cat.id)
                        : [...config.autoStoreCategories, cat.id];
                      saveConfig({ ...config, autoStoreCategories: newCategories });
                    }}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
                {/* 自定义分类 */}
                {Array.from(customCategories).map(cat => (
                  <button
                    key={cat}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      config.autoStoreCategories.includes(cat)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface text-ink-700 border-ink-900/10 hover:border-accent/50'
                    }`}
                    onClick={() => {
                      const newCategories = config.autoStoreCategories.includes(cat)
                        ? config.autoStoreCategories.filter(x => x !== cat)
                        : [...config.autoStoreCategories, cat];
                      saveConfig({ ...config, autoStoreCategories: newCategories });
                    }}
                  >
                    🏷️ {cat}
                  </button>
                ))}
                {customCategories.size === 0 && (
                  <span className="text-xs text-muted">暂无自定义分类，点击上方"+ 新建分类"创建</span>
                )}
              </div>
            </div>

            {/* 标签管理 */}
            <div className="grid gap-1.5 pt-2 border-t border-ink-900/10">
              <label className="text-xs text-muted">标签管理</label>
              {/* 标签列表和新建输入 */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <div
                      key={tag}
                      className="group relative flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-ink-900/10 text-xs text-ink-700"
                    >
                      <span>{tag}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-error hover:text-error/80 transition-opacity"
                        onClick={() => handleDeleteTag(tag)}
                        title="删除标签"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {availableTags.length === 0 && !showTagInput && (
                    <span className="text-xs text-muted">暂无标签</span>
                  )}
                </div>
                {/* 新建标签输入框 - 独立状态 */}
                {showSettingsTagInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                      placeholder="输入新标签名称..."
                      value={newSettingsTag}
                      onChange={(e) => setNewSettingsTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSettingsTag();
                        } else if (e.key === 'Escape') {
                          setShowSettingsTagInput(false);
                          setNewSettingsTag('');
                        }
                      }}
                      autoFocus
                    />
                    <button
                      className="px-3 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
                      onClick={handleAddSettingsTag}
                    >
                      添加
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl border border-ink-900/10 text-sm text-ink-700 hover:bg-ink-900/5 transition-colors"
                      onClick={() => {
                        setShowSettingsTagInput(false);
                        setNewSettingsTag('');
                      }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    className="w-full py-2 rounded-xl border border-dashed border-ink-900/10 text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors"
                    onClick={() => setShowSettingsTagInput(true)}
                  >
                    + 新建标签
                  </button>
                )}
              </div>
              <p className="text-xs text-muted mt-1">
                标签用于方便 AI 快速找到对应的记忆，AI 也可以打标签。
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* 搜索栏 */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="搜索记忆文档..."
            className="flex-1 rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="rounded-xl bg-accent px-6 py-2 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:opacity-50"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
        </div>

        {/* 操作按钮组 */}
        <div className="flex gap-3">
          <button
            className="flex-1 py-3 rounded-xl border border-dashed border-ink-900/10 text-sm text-muted hover:border-accent/50 hover:text-accent transition-colors"
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? '取消创建' : '+ 添加新记忆'}
          </button>
          <button
            className="flex-1 py-3 rounded-xl border border-dashed border-ink-900/10 text-sm text-muted hover:border-accent/50 hover:text-accent transition-colors"
            onClick={() => setIsAsking(!isAsking)}
          >
            {isAsking ? '取消问答' : '💬 AI 问答'}
          </button>
          <button
            className={`py-3 px-4 rounded-xl border text-sm transition-colors ${
              isMultiSelectMode
                ? 'bg-accent text-white border-accent'
                : 'border-ink-900/10 text-muted hover:border-accent/50 hover:text-accent'
            }`}
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              setSelectedIds(new Set());
            }}
            title={isMultiSelectMode ? '退出多选' : '进入多选模式'}
          >
            {isMultiSelectMode ? '✓ 多选' : '多选'}
          </button>
          <button
            className="py-3 px-4 rounded-xl border border-ink-900/10 text-sm text-muted hover:text-error hover:border-error/50 transition-colors"
            onClick={handleClearAll}
            title="清空所有记忆"
          >
            清空
          </button>
        </div>

        {/* 批量操作栏 */}
        {isMultiSelectMode && selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-accent/5 border border-accent/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-ink-900/20 text-accent focus:ring-accent/20"
                checked={selectedIds.size === (searchResults.length > 0 ? searchResults : documents).length}
                onChange={toggleSelectAll}
              />
              <span className="text-sm text-ink-900">已选 {selectedIds.size} 条</span>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-error text-white hover:bg-error/90 transition-colors"
                onClick={handleBatchDelete}
              >
                删除选中
              </button>
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-ink-900/10 text-ink-700 hover:bg-ink-900/5 transition-colors"
                onClick={handleBatchExport}
              >
                导出选中
              </button>
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-ink-700 transition-colors"
                onClick={() => setSelectedIds(new Set())}
              >
                取消选择
              </button>
            </div>
          </div>
        )}

        {/* 新建文档表单 - 左右50%分栏 */}
        {isCreating && (
          <div className="flex gap-6">
            {/* 左侧：表单编辑区 */}
            <div className="w-1/2 space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted">标题</label>
                <input
                  type="text"
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                  placeholder="例如：项目根目录"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted">内容</label>
                <textarea
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors min-h-[120px] resize-y"
                  placeholder="要存储的记忆内容..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted">分类</label>
                <select
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                  value={newLabel}
                  onChange={(e) => {
                    setNewLabel(e.target.value);
                    // 如果选择自定义，启用自定义输入
                    setIsCustomLabel(e.target.value === 'custom');
                  }}
                >
                  {MEMORY_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {/* 自定义分类标签输入 */}
              {isCustomLabel && (
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-muted">自定义分类名称</label>
                  <input
                    type="text"
                    className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="输入自定义分类名称..."
                    value={customLabelValue}
                    onChange={(e) => setCustomLabelValue(e.target.value)}
                  />
                </div>
              )}

              {/* 标签选择 */}
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted">标签</label>
                  <button
                    className="text-xs text-accent hover:text-accent-hover"
                    onClick={() => setShowTagInput(!showTagInput)}
                  >
                    {showTagInput ? '−' : '+ 新建标签'}
                  </button>
                </div>

                {/* 新建标签输入 */}
                {showTagInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                      placeholder="输入新标签名称..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <button
                      className="px-3 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
                      onClick={handleAddTag}
                    >
                      添加
                    </button>
                  </div>
                )}

                {/* 标签列表选择 */}
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-accent text-white border-accent'
                          : 'bg-surface text-ink-700 border-ink-900/10 hover:border-accent/50'
                      }`}
                      onClick={() => toggleTagSelection(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                  {availableTags.length === 0 && (
                    <span className="text-xs text-muted">暂无标签，点击上方"+ 新建标签"创建</span>
                  )}
                </div>
              </div>

              <button
                className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCreateDocument}
                disabled={saving || !newTitle.trim() || !newText.trim()}
              >
                {saving ? '保存中...' : '保存记忆'}
              </button>
            </div>

            {/* 右侧：说明和预览 */}
            <div className="w-1/2 space-y-4">
              <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
                <h3 className="text-sm font-medium text-ink-900 mb-2">记忆系统</h3>
                <div className="text-xs text-ink-700 space-y-2 leading-relaxed">
                  <p>• <strong>持久化存储：</strong>所有记忆存储在本地的 .mv2 文件中</p>
                  <p>• <strong>语义搜索：</strong>支持基于关键词和语义的智能搜索</p>
                  <p>• <strong>RAG 问答：</strong>AI 可以根据记忆回答相关问题</p>
                  <p>• <strong>分类管理：</strong>按类别组织记忆，便于检索</p>
                </div>
              </div>

              <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
                <h4 className="text-xs font-medium text-muted mb-2">预览</h4>
                <pre className="text-xs bg-surface rounded-lg p-3 overflow-x-auto text-muted font-mono leading-relaxed">
                  {JSON.stringify({
                    title: newTitle || '标题',
                    text: newText?.substring(0, 50) + (newText?.length > 50 ? '...' : '') || '内容',
                    label: isCustomLabel && customLabelValue ? customLabelValue : newLabel,
                    tags: selectedTags.length > 0 ? selectedTags : undefined,
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 编辑文档表单 */}
        {editingDoc && (
          <div className="rounded-xl border border-accent/20 bg-accent-light/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-accent">编辑记忆</h3>
              <button
                className="text-xs text-muted hover:text-ink-700 transition-colors"
                onClick={handleCancelEdit}
              >
                取消
              </button>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">标题</label>
              <input
                type="text"
                className="rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">内容</label>
              <textarea
                className="rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors min-h-[120px] resize-y"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">分类</label>
              <select
                className="rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                value={editLabel}
                onChange={(e) => {
                  setEditLabel(e.target.value);
                  // 如果选择自定义，启用自定义输入
                  setEditIsCustomLabel(e.target.value === 'custom');
                }}
              >
                {MEMORY_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            {/* 自定义分类标签输入 */}
            {editIsCustomLabel && (
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted">自定义分类名称</label>
                <input
                  type="text"
                  className="rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                  placeholder="输入自定义分类名称..."
                  value={editCustomLabelValue}
                  onChange={(e) => setEditCustomLabelValue(e.target.value)}
                />
              </div>
            )}

            {/* 标签选择 */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted">标签</label>
                <button
                  className="text-xs text-accent hover:text-accent-hover"
                  onClick={() => setShowEditTagInput(!showEditTagInput)}
                >
                  {showEditTagInput ? '−' : '+ 新建标签'}
                </button>
              </div>

              {/* 新建标签输入 */}
              {showEditTagInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="输入新标签名称..."
                    value={newEditTag}
                    onChange={(e) => setNewEditTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEditTag()}
                  />
                  <button
                    className="px-3 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
                    onClick={handleAddEditTag}
                  >
                    添加
                  </button>
                </div>
              )}

              {/* 标签列表选择 */}
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                      editSelectedTags.includes(tag)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface text-ink-700 border-ink-900/10 hover:border-accent/50'
                    }`}
                    onClick={() => toggleEditTagSelection(tag)}
                  >
                    {tag}
                  </button>
                ))}
                {availableTags.length === 0 && (
                  <span className="text-xs text-muted">暂无标签，点击上方"+ 新建标签"创建</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSaveEdit}
                disabled={editSaving || !editTitle.trim() || !editText.trim()}
              >
                {editSaving ? '保存中...' : '保存更改'}
              </button>
              <button
                className="px-4 py-2.5 rounded-xl border border-ink-900/10 text-sm text-ink-700 hover:bg-ink-900/5 transition-colors"
                onClick={handleCancelEdit}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* AI 问答面板 */}
        {isAsking && (
          <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4 space-y-4">
            <h3 className="text-sm font-medium text-ink-900">AI 问答 (RAG)</h3>
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-1 rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="向 AI 提问关于记忆的问题..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              />
              <button
                className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:opacity-50"
                onClick={handleAskQuestion}
                disabled={askingQuestion || !question.trim()}
              >
                {askingQuestion ? '思考中...' : '提问'}
              </button>
            </div>
            {answer && (
              <div className="rounded-xl bg-surface p-3 text-sm text-ink-700">
                <strong className="text-accent">AI 回答：</strong>
                <p className="mt-1 whitespace-pre-wrap">{answer}</p>
              </div>
            )}
          </div>
        )}

        {/* 文档列表或搜索结果 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-ink-900">
            {searchResults.length > 0 ? `搜索结果 (${searchResults.length})` : `最近记忆 (${documents.length})`}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (searchResults.length > 0 ? searchResults : documents).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted">暂无记忆</p>
              <p className="text-xs text-muted mt-2">
                点击上方"添加新记忆"按钮开始
              </p>
            </div>
          ) : (
            (searchResults.length > 0 ? searchResults : documents).map((doc) => (
              <div key={doc.id} className={`p-4 rounded-xl border transition-colors group ${
                selectedIds.has(doc.id) ? 'border-accent bg-accent/5' : 'border-ink-900/10 bg-surface'
              }`}>
                <div className="flex items-start gap-3">
                  {/* 多选框 */}
                  {isMultiSelectMode && (
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 rounded border-ink-900/20 text-accent focus:ring-accent/20"
                      checked={selectedIds.has(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                    />
                  )}
                  <span className="text-xs text-muted">
                    {MEMORY_CATEGORIES.find(c => c.id === doc.label)?.icon || '📝'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-ink-900">{doc.title}</h3>
                        {doc.score !== undefined && (
                          <span className="text-xs text-accent">相关度: {(doc.score * 100).toFixed(0)}%</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                          title="编辑"
                          onClick={() => handleEditDocument(doc)}
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-5-5" />
                          </svg>
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors"
                          title="删除"
                          onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-ink-700 line-clamp-3">{doc.text}</p>
                    {/* 标签显示 */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {doc.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-xs bg-accent/10 text-accent border border-accent/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          所有记忆存储在本地的 .mv2 文件中（用户数据目录/memvid/memory.mv2）。支持 BM25 词法搜索和语义向量搜索，提供 RAG 问答能力。
        </p>
      </aside>
    </section>
  );
}
