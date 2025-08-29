import React, { lazy, Suspense, useMemo } from "react"

/**
 * Lazy-loaded widgets with named-export interop
 */
const TokenMetricsCard = lazy(() =>
  import("./TokenMetricsCard").then(m => ({ default: m.TokenMetricsCard }))
)
const ActivityHeatTrack = lazy(() =>
  import("./ActivityHeatTrack").then(m => ({ default: m.ActivityHeatTrack }))
)
const MarketFlashPulse = lazy(() =>
  import("./MarketFlashPulse").then(m => ({ default: m.MarketFlashPulse }))
)

type AsyncHandler = () => void | Promise<void>

export interface SoltoCorePanelProps {
  /** Panel title */
  title?: string
  /** Optional refresh handler for a toolbar button */
  onRefresh?: AsyncHandler
  /** Optional last-updated time for the header */
  lastUpdated?: Date
  /** Compact spacing */
  dense?: boolean
  /** Hide a specific widget by key */
  hidden?: Partial<Record<"metrics" | "activity" | "flash", boolean>>
}

/** Simple error boundary per-widget to isolate failures */
class WidgetBoundary extends React.Component<{ label: string }, { hasError: boolean; err?: Error }> {
  state = { hasError: false as boolean, err: undefined as Error | undefined }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, err }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm"
          aria-live="polite"
        >
          <div className="font-medium mb-1">Widget failed: {this.props.label}</div>
          <div className="opacity-80">
            {this.state.err?.message ?? "Unexpected error. Try refreshing the panel."}
          </div>
        </div>
      )
    }
    return this.props.children as React.ReactElement
  }
}

/** Lightweight skeleton loader */
const BoxSkeleton: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => (
  <div className={`rounded-lg border p-4 animate-pulse bg-gray-50 ${className ?? ""}`}>
    <div className="h-4 w-1/3 rounded bg-gray-200 mb-3" />
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-3 w-full rounded bg-gray-200 mb-2 last:mb-0" />
    ))}
  </div>
)

export function SoltoCorePanel({
  title = "Solto Intelligence Hub",
  onRefresh,
  lastUpdated,
  dense = false,
  hidden,
}: SoltoCorePanelProps) {
  const sectionGap = dense ? "gap-3 p-3" : "gap-4 p-4"
  const gridGap = dense ? "gap-3" : "gap-4"
  const containerClasses = `grid ${sectionGap}`
  const subgridClasses = `grid md:grid-cols-2 ${gridGap}`

  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return null
    try {
      return lastUpdated.toLocaleString()
    } catch {
      return String(lastUpdated)
    }
  }, [lastUpdated])

  return (
    <section
      className={containerClasses}
      role="region"
      aria-labelledby="solto-core-heading"
    >
      <header className="flex items-center justify-between">
        <h2 id="solto-core-heading" className="text-xl font-semibold">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {updatedLabel && (
            <span className="text-xs text-gray-500" title="Last updated">
              Updated: {updatedLabel}
            </span>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={() => void onRefresh()}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 active:scale-[0.99] transition"
              aria-label="Refresh panel"
            >
              Refresh
            </button>
          )}
        </div>
      </header>

      <div className={subgridClasses}>
        {!hidden?.metrics && (
          <WidgetBoundary label="Token Metrics">
            <Suspense fallback={<BoxSkeleton lines={5} />}>
              <TokenMetricsCard />
            </Suspense>
          </WidgetBoundary>
        )}

        {!hidden?.activity && (
          <WidgetBoundary label="Activity Heat Track">
            <Suspense fallback={<BoxSkeleton lines={6} />}>
              <ActivityHeatTrack />
            </Suspense>
          </WidgetBoundary>
        )}
      </div>

      {!hidden?.flash && (
        <WidgetBoundary label="Market Flash Pulse">
          <Suspense fallback={<BoxSkeleton lines={4} />}>
            <MarketFlashPulse />
          </Suspense>
        </WidgetBoundary>
      )}
    </section>
  )
}

export default SoltoCorePanel
