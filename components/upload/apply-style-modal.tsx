"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

type Style = {
  id: string
  name: string
  prompt?: string
  cover_image_url?: string
}

type ApplyStyleModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedStyle?: Style | null
}

export function ApplyStyleModal({ open, onOpenChange, preselectedStyle }: ApplyStyleModalProps) {
  // const [activeTab, setActiveTab] = useState<"upload" | "select" | "generate">("upload")
  // const [selectedStyle, setSelectedStyle] = useState<Style | null>(preselectedStyle || null)
  // const [file, setFile] = useState<File | null>(null)
  // const [isGenerating, setIsGenerating] = useState(false)

  // useEffect(() => {
  //   if (open) {
  //     setActiveTab(file ? (selectedStyle ? "generate" : "select") : "upload")
  //     setSelectedStyle(preselectedStyle || null)
  //   }
  // }, [open, preselectedStyle, file, selectedStyle])

  // const canGenerate = useMemo(() => Boolean(file && selectedStyle), [file, selectedStyle])

  // async function handleGenerate() {
  //   if (!canGenerate) return
  //   setIsGenerating(true)
  //   try {
  //     await new Promise((r) => setTimeout(r, 1200))
  //     toast.success("Generated successfully")
  //   } catch (e) {
  //     toast.error("Failed to generate")
  //   } finally {
  //     setIsGenerating(false)
  //   }
  // }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Apply Style to Your Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <span className="text-2xl">🚧</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Feature Coming Soon!</h3>
              <p className="text-muted-foreground leading-relaxed">
                This feature is not live yet. You can just copy the prompt and paste it in Gemini with your selfie image to get the same output.
              </p>
            </div>
          </div>

          {preselectedStyle && (
            <div className="border rounded-xl p-4 bg-muted/50">
              <div className="flex items-center gap-3">
                <img 
                  src={preselectedStyle.cover_image_url || '/placeholder.svg'} 
                  alt={preselectedStyle.name} 
                  className="w-12 h-12 object-cover rounded-lg" 
                />
                <div>
                  <div className="font-medium">{preselectedStyle.name}</div>
                  <div className="text-sm text-muted-foreground">Selected Style</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} className="rounded-xl">
              Got it
            </Button>
          </div>
        </div>

        {/* Commented out the original tabs implementation */}
        {/* 
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="select">Select Style</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="border border-dashed rounded-xl p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-2">Drag & drop not implemented in this stub.</p>
            </div>
            <div className="flex justify-end">
              <Button
                disabled={!file}
                onClick={() => setActiveTab("select")}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="select" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-auto">
              {preselectedStyle ? (
                <button
                  onClick={() => setSelectedStyle(preselectedStyle)}
                  className={`border rounded-xl overflow-hidden text-left ${selectedStyle?.id === preselectedStyle.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <img src={preselectedStyle.cover_image_url || '/placeholder.svg'} alt={preselectedStyle.name} className="w-full h-28 object-cover" />
                  <div className="p-2 text-sm">{preselectedStyle.name}</div>
                </button>
              ) : (
                <div className="text-sm text-muted-foreground">No style passed. This step lists styles in full implementation.</div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setActiveTab("upload")} className="rounded-xl">Back</Button>
              <Button
                disabled={!selectedStyle}
                onClick={() => setActiveTab("generate")}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border rounded-xl p-3">
                <div className="text-sm font-medium mb-2">Your Photo</div>
                {file ? (
                  <img src={URL.createObjectURL(file)} alt="upload" className="w-full h-48 object-cover rounded-lg" />
                ) : (
                  <div className="h-48 bg-muted rounded-lg" />
                )}
              </div>
              <div className="border rounded-xl p-3">
                <div className="text-sm font-medium mb-2">Selected Style</div>
                {selectedStyle ? (
                  <div className="flex gap-3 items-center">
                    <img src={selectedStyle.cover_image_url || '/placeholder.svg'} alt={selectedStyle.name} className="w-16 h-16 object-cover rounded-md" />
                    <div>
                      <div className="text-sm font-medium">{selectedStyle.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{selectedStyle.prompt}</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 bg-muted rounded-lg" />
                )}
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setActiveTab("select")} className="rounded-xl">Back</Button>
              <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="rounded-xl">
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        */}
      </DialogContent>
    </Dialog>
  )
}


