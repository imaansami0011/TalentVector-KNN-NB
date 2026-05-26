import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/onboarding/")({
  beforeLoad: () => {
    const role = localStorage.getItem("user_role")
    if (role === "hr") {
      throw redirect({
        to: "/onboarding/recruiter",
      })
    } else if (role === "candidate") {
      throw redirect({
        to: "/onboarding/candidate",
      })
    } else {
      throw redirect({
        to: "/",
      })
    }
  },
})
