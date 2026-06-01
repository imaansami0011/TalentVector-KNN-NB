import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/screening")({
  beforeLoad: () => {
    throw redirect({ to: "/hr/jobs/new", replace: true })
  },
})
