import * as React from "react"
import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/onboarding")({
  component: OnboardingLayout,
})

function OnboardingLayout() {
  return <Outlet />
}
