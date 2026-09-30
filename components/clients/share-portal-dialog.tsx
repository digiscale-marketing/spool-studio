"use client"

import { Check, Copy, Link2, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { portalApi, type PortalTokenInfo } from "@/lib/api-client"

function portalLink(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin ?? ""
  return `${base.replace(/\/+$/, "")}/${token}`
}

export function SharePortalDialog({
  clientId,
  clientName,
  trigger,
}: {
  clientId: string
  clientName: string
  trigger: React.ReactNode
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [token, setToken] = useState<PortalTokenInfo | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) {
      setToken(null)
      setCopied(false)
    }
  }, [open])

  const generate = async () => {
    setGenerating(true)
    try {
      const created = await portalApi.createToken(clientId, expiresInDays)
      setToken(created)
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Couldn't create link",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const copy = async () => {
    if (!token?.token) return
    try {
      await navigator.clipboard.writeText(portalLink(token.token))
      setCopied(true)
      toast({ title: "Client link copied" })
    } catch {
      toast({ title: "Copy failed — select the link manually" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger}
      </span>
      <DialogContent className="w-[95vw] max-w-md bg-[#161616] text-white border-[rgba(255,255,255,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-white text-[16px] font-medium">
            Share {clientName} with client
          </DialogTitle>
          <DialogDescription className="text-[#a1a1aa] mt-1 text-[13px]">
            Anyone with this link can view assets, comment, and approve — no
            account needed.
          </DialogDescription>
        </DialogHeader>

        {token?.token ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 py-2">
              <Link2 className="h-4 w-4 shrink-0 text-[#71717a]" />
              <span className="truncate font-mono text-[12px] text-white">
                {portalLink(token.token)}
              </span>
            </div>
            <p className="text-[12px] text-[#71717a]">
              Expires {new Date(token.expires_at).toLocaleDateString()}. The
              full link is shown only once — copy it now.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={copy}
                className="h-9 flex-1 bg-[var(--primary)] text-[13px] text-white hover:bg-[#4f46e5]"
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setToken(null)
                  setCopied(false)
                }}
                className="h-9 border-[rgba(255,255,255,0.08)] bg-transparent text-[13px] text-white hover:bg-[rgba(255,255,255,0.06)]"
              >
                New link
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">
                Link expires in
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="h-9 w-full rounded-md bg-[#1a1a1a] border-[rgba(255,255,255,0.08)] px-2 text-[13px] text-white"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <Button
              onClick={generate}
              disabled={generating}
              className="h-9 w-full bg-[var(--primary)] text-[13px] text-white hover:bg-[#4f46e5]"
            >
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate client link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
