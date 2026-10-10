import { NextResponse } from "next/server"
import { jsonError } from "@/lib/api-error"
import { logProductionRuntimeError } from "@/lib/runtime-diagnostics"
import { getDesignerAnalytics } from "@/services/designer-analytics-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") ?? "10", 10)
    const result = await getDesignerAnalytics(
      Number.isFinite(days) ? days : 10,
    )
    return NextResponse.json({ data: result })
  } catch (error) {
    logProductionRuntimeError("api-analytics-designers-get", error)
    return jsonError(error)
  }
}
