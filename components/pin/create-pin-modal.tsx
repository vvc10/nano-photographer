"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { X, Upload, ChevronDown, Plus } from "lucide-react"
import { useStyleOperations } from "@/hooks/use-database"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Instagram } from "lucide-react"
import { TAG_OPTIONS } from "@/lib/tag-constants"

interface CreatePinModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Removed legacy language and component type constants

export function CreatePinModal({ open, onOpenChange }: CreatePinModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    url: "",
    prompt: "",
    category: "All",
    tags: "",
    description: "",
    credits: "",
    people_type: "all"
  })
  const { createStyle, loading, error } = useStyleOperations()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Parse tags from comma-separated string
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      // Add category tag if not All
      if (formData.category && formData.category !== "All") {
        tags.push(formData.category)
      }

      const stylePayload = {
        name: formData.title,
        description: formData.description || undefined,
        full_prompt: formData.prompt || undefined,
        cover_image_url: formData.image || formData.url || undefined,
        category: formData.category || undefined,
        tags,
        credits: formData.credits || undefined,
        visibility: 'public' as const,
        people_type: formData.people_type && formData.people_type !== 'all' ? formData.people_type : undefined,
      }

      const newStyle = await createStyle(stylePayload)
      
             toast.success("🎉 Style Created!", {
               description: `"${formData.title}" has been successfully created!`,
               duration: 4000,
             })
      onOpenChange(false)
      
      // Reset form
      setFormData({
        title: "",
        image: "",
        url: "",
        prompt: "",
        category: "All",
        tags: "",
        description: "",
        credits: "",
        people_type: "all"
      })

      // Redirect to the new style (slug if available)
      router.push(`/styles/${newStyle.slug || newStyle.id}`)
    } catch (err) {
             toast.error("❌ Failed to Create Style", {
               description: error || "Something went wrong while creating your pin. Please try again.",
               duration: 5000,
             })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }))
  }

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url: url }))
  }

  // Removed language toggle handler

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[85vw] h-[85vh] sm:w-[75vw] sm:h-[75vh] rounded-2xl max-w-none max-h-none overflow-hidden p-2 sm:p-4 m-0 z-[9999]"
        style={{
          width: '85vw',
          height: '85vh',
          maxWidth: 'none',
          maxHeight: 'none',
          zIndex: 9999
        }}
      >
        <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-semibold">Submit a new style</DialogTitle>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                You can submit your own style, but it will be available to users after admin approval.
              </p>
            </div>
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </DialogHeader>



                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Left Side - File Upload Area */}
          <div className="flex-1 p-3 sm:p-6 sm:border-r border-b sm:border-b-0">
            <div className="h-full flex flex-col">
              {/* Main Upload Area */}
              <div className="flex-1 min-h-[200px] sm:min-h-0">
                {/* Image Upload Component */}
                <ImageUpload
                  value={formData.image}
                  onChange={handleImageChange}
                  disabled={loading}
                />
                
                {/* URL Input Field */}
                <div className="mt-4 space-y-2">
                  <Label htmlFor="url-input" className="text-sm font-medium">Or paste generated image URL</Label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/screenshot.png"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="rounded-xl sm:rounded-2xl bg-secondary dark:bg-muted border-0 text-sm sm:text-base"
                    disabled={loading}
                  />
                </div>

                {/* Upload area for style cover image */}
              </div>
            </div>
          </div>

          {/* Right Side - Form Fields */}
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
            <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
              {/* Title */}
              <div className="space-y-2">
              <Input
                  placeholder="Style name"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                  className="rounded-xl sm:rounded-2xl bg-secondary dark:bg-muted border-0 text-sm sm:text-base"
                required
              />
            </div>

              {/* Description */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Write something about it or description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px] rounded-xl sm:rounded-2xl bg-secondary dark:bg-muted border-0 resize-none text-sm sm:text-base"
                />
              </div>

            {/* Credits */}
            <div className="space-y-2">
              <Input
                placeholder="Credit: @username or source name (optional)"
                value={formData.credits}
                onChange={(e) => handleInputChange("credits", e.target.value)}
                className="rounded-xl sm:rounded-2xl bg-secondary dark:bg-muted border-0 text-sm sm:text-base"
              />
            </div>



              {/* Component type removed */}

              {/* Category */}
              <div className="grid gap-2">
                <Label className="opacity-60">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAG_OPTIONS.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.hasIcon ? (
                          <span className="inline-flex items-center gap-1">
                            <span>{c.displayValue}</span>
                            <Instagram className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          c.displayValue
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="grid gap-2">
                <Label className="opacity-60">Type</Label>
                <Select value={formData.people_type} onValueChange={(value) => handleInputChange("people_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { label: 'All', value: 'all' },
                      { label: 'Men', value: 'men' },
                      { label: 'Woman', value: 'woman' },
                      { label: 'Couple', value: 'couple' },
                    ].map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="opacity-60">Tags</Label>
                <Input
                  id="tags"
                  placeholder="e.g., modern, minimal, colorful"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Separate tags with commas. Category will be added automatically.</p>
              </div>

              {/* Legacy fields removed */}


              {/* Full Prompt Field */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Full prompt used for generation (optional)"
                  value={formData.prompt}
                  onChange={(e) => handleInputChange("prompt", e.target.value)}
                  className="min-h-[120px] sm:min-h-[150px] rounded-xl sm:rounded-2xl bg-secondary dark:bg-muted border-0 resize-none text-sm"
                />
              </div>

            

              {/* Submit Button */}
              <div className="pt-2 sm:pt-4">
            <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-sm sm:text-base py-2 sm:py-3"
                >
              {loading ? "Creating..." : "Create Style"}
            </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
