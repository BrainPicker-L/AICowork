/**
 * 增强的 Markdown 渲染组件
 * 支持 SVG 图表、代码块、表格等多种渲染类型
 */

import React from 'react';
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import type { HTMLAttributes } from 'react';

interface ComponentProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

/**
 * SVG 图表组件
 * 支持简单的柱状图、饼图、折线图
 */
function SvgChart({ type, data, title }: { type: 'bar' | 'pie' | 'line'; data: any; title?: string }) {
  const renderBarChart = () => {
    const values = Array.isArray(data) ? data : [];
    const maxValue = Math.max(...values.map((v: any) => v.value || 0), 1);
    const barWidth = 300 / values.length;
    const chartHeight = 150;

    return (
      <svg viewBox={`0 0 350 ${chartHeight + 40}`} className="w-full h-auto">
        {title && <text x="175" y="15" textAnchor="middle" className="text-xs font-medium" fill="currentColor">{title}</text>}
        {values.map((item: any, i: number) => {
          const value = item.value || 0;
          const height = (value / maxValue) * (chartHeight - 20);
          const x = i * barWidth + 10;
          const y = chartHeight - height + 10;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth - 15} height={height} fill="currentColor" className="text-accent opacity-80" rx="2" />
              <text x={x + (barWidth - 15) / 2} y={chartHeight + 25} textAnchor="middle" className="text-[10px]" fill="currentColor">
                {item.label || i}
              </text>
              <text x={x + (barWidth - 15) / 2} y={y - 5} textAnchor="middle" className="text-[10px]" fill="currentColor">
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderPieChart = () => {
    const values = Array.isArray(data) ? data : [];
    const total = values.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
    let currentAngle = 0;
    const colors = ['text-accent', 'text-success', 'text-error', 'text-muted', 'text-ink-700'];

    return (
      <svg viewBox="0 0 200 200" className="w-full h-auto max-w-[200px]">
        {title && <text x="100" y="15" textAnchor="middle" className="text-xs font-medium" fill="currentColor">{title}</text>}
        <g transform="translate(100, 110)">
          {values.map((item: any, i: number) => {
            const value = item.value || 0;
            const percentage = (value / total) * 100;
            const angle = (percentage / 100) * 360;
            const largeArc = angle > 180 ? 1 : 0;
            const x1 = Math.cos((currentAngle * Math.PI) / 180) * 80;
            const y1 = Math.sin((currentAngle * Math.PI) / 180) * 80;
            const x2 = Math.cos(((currentAngle + angle) * Math.PI) / 180) * 80;
            const y2 = Math.sin(((currentAngle + angle) * Math.PI) / 180) * 80;

            const pathData = `M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
            currentAngle += angle;

            return (
              <g key={i}>
                <path d={pathData} fill="currentColor" className={colors[i % colors.length]} opacity="0.8" />
                <text
                  x={Math.cos(((currentAngle - angle / 2) * Math.PI) / 180) * 50}
                  y={Math.sin(((currentAngle - angle / 2) * Math.PI) / 180) * 50}
                  textAnchor="middle"
                  className="text-[10px]"
                  fill="white"
                  fontWeight="500"
                >
                  {percentage.toFixed(0)}%
                </text>
              </g>
            );
          })}
        </g>
        <g transform="translate(100, 200)">
          {values.map((item: any, i: number) => (
            <g key={i} transform={`translate(${(i % 2) * 90 - 45}, ${Math.floor(i / 2) * 15})`}>
              <circle cx="0" cy="0" r="5" className={colors[i % colors.length]} opacity="0.8" />
              <text x="10" y="4" className="text-[10px]" fill="currentColor">{item.label || i}: {item.value}</text>
            </g>
          ))}
        </g>
      </svg>
    );
  };

  const renderLineChart = () => {
    const values = Array.isArray(data) ? data : [];
    const maxValue = Math.max(...values.map((v: any) => v.value || 0), 1);
    const width = 300;
    const height = 120;
    const padding = 20;
    const points = values.map((item: any, i: number) => {
      const x = (i / (values.length - 1 || 1)) * (width - 2 * padding) + padding;
      const y = height - ((item.value || 0) / maxValue) * (height - 2 * padding) - padding;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height + 40}`} className="w-full h-auto">
        {title && <text x={width / 2} y="15" textAnchor="middle" className="text-xs font-medium" fill="currentColor">{title}</text>}
        {/* 坐标轴 */}
        <line x1={padding} y1={height} x2={width - padding} y2={height} stroke="currentColor" strokeWidth="1" className="text-muted opacity-30" />
        <line x1={padding} y1={padding} x2={padding} y2={height} stroke="currentColor" strokeWidth="1" className="text-muted opacity-30" />
        {/* 折线 */}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-accent"
        />
        {/* 数据点 */}
        {values.map((item: any, i: number) => {
          const x = (i / (values.length - 1 || 1)) * (width - 2 * padding) + padding;
          const y = height - ((item.value || 0) / maxValue) * (height - 2 * padding) - padding;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="currentColor" className="text-accent" />
              <text x={x} y={height + 15} textAnchor="middle" className="text-[10px]" fill="currentColor">
                {item.label || i}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4 my-3">
      {type === 'bar' && renderBarChart()}
      {type === 'pie' && renderPieChart()}
      {type === 'line' && renderLineChart()}
    </div>
  );
}

/**
 * Mermaid 流程图组件（简化版 SVG）
 */
function MermaidDiagram({ code }: { code: string }) {
  // 简化的流程图解析器
  const parseFlowchart = () => {
    const lines = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('```'));
    const nodes: string[] = [];
    const connections: string[][] = [];

    lines.forEach(line => {
      const match = line.match(/(\w+)\s*[-=]>\s*(\w+)/);
      if (match) {
        const [, from, to] = match;
        if (!nodes.includes(from)) nodes.push(from);
        if (!nodes.includes(to)) nodes.push(to);
        connections.push([from, to]);
      }
    });

    const nodeWidth = 100;
    const nodeHeight = 40;
    const gap = 40;

    // 简单的布局算法
    const layout = new Map<string, { x: number; y: number }>();
    nodes.forEach((node, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      layout.set(node, { x: col * (nodeWidth + gap), y: row * (nodeHeight + gap) });
    });

    const width = Math.max(300, (nodes.length > 3 ? 3 : nodes.length) * (nodeWidth + gap));
    const height = Math.max(150, Math.ceil(nodes.length / 3) * (nodeHeight + gap) + 40);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-muted" />
          </marker>
        </defs>
        {/* 连接线 */}
        {connections.map(([from, to], i) => {
          const fromPos = layout.get(from);
          const toPos = layout.get(to);
          if (!fromPos || !toPos) return null;
          return (
            <line
              key={i}
              x1={fromPos.x + nodeWidth / 2}
              y1={fromPos.y + nodeHeight}
              x2={toPos.x + nodeWidth / 2}
              y2={toPos.y}
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-muted"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        {/* 节点 */}
        {nodes.map((node, i) => {
          const pos = layout.get(node);
          if (!pos) return null;
          return (
            <g key={i}>
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeWidth}
                height={nodeHeight}
                rx="6"
                fill="currentColor"
                className="text-accent/10"
                stroke="currentColor"
                strokeWidth="1"
              />
              <text
                x={pos.x + nodeWidth / 2}
                y={pos.y + nodeHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs"
                fill="currentColor"
                fontWeight="500"
              >
                {node}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4 my-3">
      {parseFlowchart()}
    </div>
  );
}

/**
 * 解析特殊的图表语法
 * 支持：
 * ```chart bar
 * label1, value1
 * label2, value2
 * ```
 */
function parseChartBlock(code: string): { type: string; data: any; title?: string } | null {
  const lines = code.trim().split('\n');
  if (lines.length < 2) return null;

  const firstLine = lines[0].trim();
  if (!firstLine.startsWith('chart:')) return null;

  const parts = firstLine.split(':');
  const type = parts[1]?.trim();
  const title = parts[2]?.trim();

  const data = lines.slice(1).map(line => {
    const [label, value] = line.split(',').map(s => s.trim());
    return { label, value: parseFloat(value) || 0 };
  }).filter(item => !isNaN(item.value));

  if (data.length === 0) return null;

  return { type, data, title };
}

/**
 * 解析 Mermaid 语法
 */
function isMermaidBlock(code: string): boolean {
  const trimmed = code.trim().toLowerCase();
  return trimmed.startsWith('flowchart') ||
         trimmed.startsWith('graph') ||
         trimmed.startsWith('sequence') ||
         (trimmed.includes('-->') && /\w+\s*-->/.test(trimmed));
}

export default function MDContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        h1: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <h1 className="mt-4 text-xl font-semibold text-ink-900" {...props} />
        ),
        h2: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <h2 className="mt-4 text-lg font-semibold text-ink-900" {...props} />
        ),
        h3: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <h3 className="mt-3 text-base font-semibold text-ink-800" {...props} />
        ),
        p: ({ className, children, ...props }: Omit<ComponentProps, 'ref'>) => (
          <p className="mt-2 text-base leading-relaxed text-ink-700" {...props}>
            {children}
          </p>
        ),
        ul: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <ul className="mt-2 ml-4 grid list-disc gap-1" {...props} />
        ),
        ol: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <ol className="mt-2 ml-4 grid list-decimal gap-1" {...props} />
        ),
        li: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <li className="min-w-0 text-ink-700" {...props} />
        ),
        strong: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <strong className="text-ink-900 font-semibold" {...props} />
        ),
        em: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <em className="text-ink-800" {...props} />
        ),
        table: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-900/10 border border-ink-900/10 rounded-lg" {...props} />
          </div>
        ),
        thead: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <thead className="bg-surface-secondary" {...props} />
        ),
        tbody: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <tbody className="divide-y divide-ink-900/5" {...props} />
        ),
        tr: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <tr className="hover:bg-surface-tertiary/50" {...props} />
        ),
        th: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <th className="px-4 py-2 text-left text-xs font-semibold text-ink-900 uppercase tracking-wider" {...props} />
        ),
        td: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <td className="px-4 py-2 text-sm text-ink-700 whitespace-nowrap" {...props} />
        ),
        pre: ({ className, children, ...props }: Omit<ComponentProps & { children?: React.ReactNode }, 'ref'>) => {
          // 安全地提取代码内容 - ReactMarkdown 的 pre 包含 code 元素
          const extractCodeFromElement = (node: React.ReactNode): string => {
            if (typeof node === 'string') return node;
            if (typeof node === 'number') return String(node);
            if (typeof node === 'boolean' || !node) return '';

            // 处理 ReactElement - 使用类型断言获取 props
            if (React.isValidElement(node)) {
              const props = (node as any).props;
              if (props?.children) {
                // 递归处理子元素
                return extractCodeFromElement(props.children);
              }
            }

            // 处理数组
            if (Array.isArray(node)) {
              return node.map(extractCodeFromElement).join('');
            }

            return '';
          };

          const codeContent = extractCodeFromElement(children);

          // 检查是否是图表代码块
          const chartConfig = parseChartBlock(codeContent);
          if (chartConfig) {
            return <SvgChart type={chartConfig.type as any} data={chartConfig.data} title={chartConfig.title} />;
          }

          // 检查是否是 Mermaid 图
          if (isMermaidBlock(codeContent)) {
            return <MermaidDiagram code={codeContent} />;
          }

          return (
            <pre
              className="mt-3 max-w-full overflow-x-auto whitespace-pre-wrap rounded-xl bg-surface-tertiary p-3 text-sm text-ink-700"
              {...props}
            >
              {children}
            </pre>
          );
        },
        code: ({ className, children, ...rest }: Omit<ComponentProps & { children?: React.ReactNode }, 'ref'>) => {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !String(children).includes("\n");

          return isInline ? (
            <code className="rounded bg-surface-tertiary px-1.5 py-0.5 text-accent font-mono text-base" {...rest}>
              {children}
            </code>
          ) : (
            <code className={`${className || ''} font-mono`} {...rest}>
              {children}
            </code>
          );
        },
        blockquote: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <blockquote className="border-l-4 border-accent pl-4 py-1 my-2 text-ink-700 italic" {...props} />
        ),
        hr: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <hr className="my-4 border-ink-900/10" {...props} />
        ),
        a: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <a className="text-accent hover:text-accent-hover underline" target="_blank" rel="noopener noreferrer" {...props} />
        ),
        img: ({ className, ...props }: Omit<ComponentProps, 'ref'>) => (
          <img className="rounded-lg max-w-full h-auto my-2" {...props} />
        ),
      }}
    >
      {String(text ?? "")}
    </ReactMarkdown>
  );
}
