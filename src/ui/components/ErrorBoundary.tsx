/**
 * React 错误边界组件
 *
 * 捕获子组件树中的 JavaScript 错误，记录错误日志，
 * 并显示备用 UI 而不是使整个应用崩溃
 */

import { Component, ReactNode } from "react";
import { log } from "../utils/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

/**
 * 错误边界类组件
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // 记录错误到日志系统
    log.error("[ErrorBoundary] React 组件错误捕获", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // 更新 state
    this.setState({
      error,
      errorInfo
    });

    // 调用外部错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * 默认错误回退 UI
 */
function ErrorFallback({
  error,
  onReset
}: {
  error: Error | null;
  onReset: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-error/20 bg-error-light p-6 shadow-elevated">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/20">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-error" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-error">出错了</h2>
        </div>

        <p className="text-sm text-error mb-4">
          应用遇到了意外错误，请尝试刷新页面或重启应用。
        </p>

        {error && (
          <details className="mb-4">
            <summary className="cursor-pointer text-xs font-medium text-muted hover:text-ink-700 transition-colors">
              查看错误详情
            </summary>
            <div className="mt-2 rounded-lg bg-surface p-3 text-xs font-mono text-ink-800">
              <div className="font-semibold mb-1">{error.name}: {error.message}</div>
              <pre className="whitespace-pre-wrap break-words opacity-80">
                {error.stack}
              </pre>
            </div>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors"
          >
            重试
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-tertiary transition-colors"
          >
            刷新页面
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-error/20 text-xs text-muted">
          错误信息已记录到日志文件
        </div>
      </div>
    </div>
  );
}

/**
 * 函数式错误边界 Hook 包装器
 *
 * 使用示例：
 * ```tsx
 * <WithErrorBoundary>
 *   <YourComponent />
 * </WithErrorBoundary>
 * ```
 */
export function WithErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
