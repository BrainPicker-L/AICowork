/**
 * Brain 图标组件 - 支持动态颜色
 * 使用包装器 + CSS 类方式，确保 SVG 图标正确着色
 */

import { Brain as LucideBrain } from "lucide-react";

interface BrainIconProps {
  className?: string;
  color?: 'error' | 'success' | 'info' | 'muted';
}

// 将颜色类型映射到 CSS 类名
const colorClassMap: Record<string, string> = {
  error: 'text-error',
  success: 'text-success',
  info: 'text-info',
  muted: 'text-muted-light',
};

// 简单的类名合并工具函数
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function BrainIcon({ className = '', color }: BrainIconProps) {
  const colorClass = color ? colorClassMap[color] : '';
  const wrapperClass = cn(
    'inline-flex',
    colorClass,
    className
  );

  return (
    <span className={wrapperClass}>
      <LucideBrain className={className} />
    </span>
  );
}
