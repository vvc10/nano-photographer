"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUpload } from "@/components/ui/image-upload"
import { X, Send, Lightbulb, FileText } from "lucide-react"
import { toast } from "sonner"

interface SubmissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SubmissionType = "prompt" | "suggestion"

export function SubmissionModal({ open, onOpenChange }: SubmissionModalProps) {
  const [activeTab, setActiveTab] = useState<SubmissionType>("prompt")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: activeTab,
          title: formData.title.trim(),
          content: formData.content.trim(),
          image: formData.image.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit")
      }

      toast.success(
        activeTab === "prompt" 
          ? "🎉 Prompt submitted successfully!" 
          : "💡 Suggestion submitted successfully!",
        {
          description: "Thank you for your contribution! We'll review it soon.",
          duration: 4000,
        }
      )

      // Reset form
      setFormData({ title: "", content: "", image: "" })
      onOpenChange(false)
    } catch (error) {
      toast.error("❌ Failed to submit", {
        description: "Something went wrong. Please try again.",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Want to submit your prompt?
            </DialogTitle>
           
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SubmissionType)} className="w-full dark:hover:bg-zinc-500">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompt" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Submit Prompt
            </TabsTrigger>
            <TabsTrigger value="suggestion" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Feature Suggestion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="prompt-title">Prompt Title *</Label>
              <Input
                id="prompt-title"
                placeholder="e.g., Modern minimalist portrait with soft lighting"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              
              <ImageUpload
                value={formData.image}
                onChange={handleImageChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-content">Full Prompt *</Label>
              <Textarea
                id="prompt-content"
                placeholder="Paste your complete prompt here..."
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                className="min-h-[200px] rounded-xl resize-none"
                required
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Tip:</strong> Share your best prompts with the community! 
                Include details about style, lighting, composition, and any special techniques you used.
                Upload the generated image to show the result!
              </p>
            </div>
          </TabsContent>

          <TabsContent value="suggestion" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="suggestion-title">Feature Title *</Label>
              <Input
                id="suggestion-title"
                placeholder="e.g., Add batch download feature"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suggestion-content">Detailed Suggestion *</Label>
              <Textarea
                id="suggestion-content"
                placeholder="Describe your feature idea in detail..."
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                className="min-h-[200px] rounded-xl resize-none"
                required
              />
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>🚀 We love feedback!</strong> Your suggestions help us improve the platform. 
                Be specific about what you'd like to see and how it would help you.
                Upload a mockup or reference image if you have one!
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
