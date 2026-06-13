import * as React from "react"
import { createRootRouteWithContext, Outlet, Link } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
})

function RootComponent() {

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-right" richColors toastOptions={{ style: { borderRadius: '12px' } }} />
    </QueryClientProvider>
  )
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center dark:bg-slate-950">
      <div className="max-w-md">
        <h1 className="font-display text-8xl font-black text-primary">404</h1>
        <h2 className="mt-4 text-2xl font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">Page not found</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-102 hover:bg-primary/95"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}

function ErrorComponent({ error, reset }) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center dark:bg-slate-950">
      <div className="max-w-md">
        <h1 className="font-display text-4xl font-black text-destructive uppercase tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          An unexpected error occurred. You can try refreshing the page or going back.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-102 hover:bg-primary/95"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-input bg-card px-6 text-xs font-black uppercase tracking-widest text-foreground hover:bg-slate-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
