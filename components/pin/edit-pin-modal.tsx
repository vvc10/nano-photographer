"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { X } from "lucide-react"
import { useStyleEditOperations } from "@/hooks/use-database"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Instagram } from "lucide-react"
import { TAG_OPTIONS } from "@/lib/tag-constants"
// Using a relaxed type to accept either legacy pin or new style
type AnyItem = any

interface EditPinModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pin: AnyItem | null
}

const LANGUAGES = [
  "javascript", "typescript", "python", "css", "go", "rust", "sql", "html", "php", "java", "csharp", "swift"
]

const COMPONENT_TYPES = [
  "all", "Hero", "Footer", "Navigation", "Sidebar", "Header", 
  "Carousel", "Slider", "Cards", "Accordions", "Tabs", "Modals / Dialogs",
  "Dropdowns", "Tooltips / Popovers", "Forms",
  "Search Bars", "Tables", "Grids", "Pagination", 
  "Buttons", "Alerts", "Toasts", "Badges", "Tags", "Chips",
  "dashboard", "landing", "pricing", "faq", "dark-mode", "minimal", "tailwind", "react"
]

export function EditPinModal({ open, onOpenChange, pin }: EditPinModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    url: "",
    figma_code: "",
    code: "",
    languages: [] as string[],
    componentType: "",
    tags: "",
    description: "",
    credits: "",
    category: "All",
    people_type: "all"
  })
  const { updateStyle, loading, error } = useStyleEditOperations()
  const router = useRouter()

  // Populate form when pin changes
  useEffect(() => {
    if (pin) {
      console.log('Edit modal received item:', pin)
      
      // Extract component type from tags
      const componentTypes = [
        "Hero", "Footer", "Navigation", "Sidebar", "Header", 
        "Carousel", "Slider", "Cards", "Accordions", "Tabs", "Modals / Dialogs",
        "Dropdowns", "Tooltips / Popovers", "Forms",
        "Search Bars", "Tables", "Grids", "Pagination", 
        "Buttons", "Alerts", "Toasts", "Badges", "Tags", "Chips",
        "dashboard", "landing", "pricing", "faq", "dark-mode", "minimal", "tailwind", "react"
      ]
      
      const pinTags = pin.tags || []
      const foundType = componentTypes.find(type => pinTags.includes(type))
      const otherTags = pinTags.filter(tag => !componentTypes.includes(tag))
      
      setFormData({
        title: pin.name || pin.title || "",
        image: pin.cover_image_url || pin.image || "",
        url: pin.url || "",
        figma_code: pin.figma_code || "",
        code: pin.full_prompt || pin.code || "",
        languages: pin.lang ? pin.lang.split(", ").filter(Boolean) : [],
        componentType: foundType || "",
        tags: otherTags.join(", "),
        description: pin.description || pin.short_prompt || "",
        credits: pin.credits || "",
        category: pin.category || "All",
        people_type: (pin.people_type || "all")
      })
    }
  }, [pin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pin) return
    
    try {
      // Parse tags from comma-separated string and add component type
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      
      // Add component type to tags if selected and not "all"
      if (formData.componentType && formData.componentType !== "all") {
        tags.push(formData.componentType)
      }


      const updates = {
        name: formData.title || undefined,
        description: formData.description || undefined,
        full_prompt: formData.code || undefined,
        cover_image_url: formData.image || formData.url || undefined,
        credits: formData.credits || undefined,
        category: formData.category || undefined,
        people_type: formData.people_type && formData.people_type !== 'all' ? formData.people_type : undefined,
      }

      await updateStyle(pin.id, updates)

      toast.success("✏️ Style Updated!", {
        description: `"${formData.title}" has been successfully updated!`,
        duration: 4000,
      })
      
      onOpenChange(false)
      
      // Reset form
      setFormData({
        title: "",
        image: "",
        url: "",
        figma_code: "",
        code: "",
        languages: [],
        componentType: "",
        tags: "",
        description: "",
        credits: "",
        category: "All",
        people_type: "all"
      })

      // Refresh the page to show updated content
      router.refresh()
    } catch (err) {
      toast.error("❌ Failed to Update Style", {
        description: error || "Something went wrong while updating your style. Please try again.",
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

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }))
  }

  if (!pin) {
    console.log('Edit modal: No pin provided')
    return null
  }



  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log('🔄 Edit modal onOpenChange called with:', newOpen)
      onOpenChange(newOpen)
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl [&>div]:rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Edit Style</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Style name *</Label>
              <Input
                id="title"
                placeholder="e.g., Responsive CSS Grid Cheat Sheet"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Write something about it or description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credits">Credits (optional)</Label>
              <Input
                id="credits"
                placeholder="Credit: @username or source name"
                value={formData.credits}
                onChange={(e) => handleInputChange("credits", e.target.value)}
              />
            </div>
            <ImageUpload
              value={formData.image}
              onChange={handleImageChange}
              disabled={loading}
            />
            
            {/* URL Input Field */}
            <div className="grid gap-2">
              <Label htmlFor="url-input">Or paste cover image URL</Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com/screenshot.png"
                value={formData.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Figma Code Input Field */}
            <div className="grid gap-2">
              <Label htmlFor="figma-input">Figma file code (optional)</Label>
              <Input
                id="figma-input"
                type="text"
                placeholder="Paste your Figma file code here..."
                value={formData.figma_code}
                onChange={(e) => handleInputChange("figma_code", e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label className="opacity-60">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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

            <div className="grid gap-2">
              <Label className="opacity-60">Type</Label>
              <Select value={formData.people_type} onValueChange={(value) => setFormData(prev => ({ ...prev, people_type: value }))}>
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
              <Label className="opacity-60">Select Stack (legacy)</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const isSelected = formData.languages.includes(lang)
                  return (
                    <Button
                      key={lang}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLanguageToggle(lang)}
                      className={`text-xs rounded-full ${
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary dark:bg-muted border-border"
                      }`}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </Button>
                  )
                })}
              </div>
              {formData.languages.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {formData.languages.join(", ")}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="opacity-60">Component Type (legacy)</Label>
              <Select value={formData.componentType} onValueChange={(value) => handleInputChange("componentType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select component type" />
                </SelectTrigger>
                <SelectContent>
                  {COMPONENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="opacity-60">Tags (legacy)</Label>
              <Input
                id="tags"
                placeholder="e.g., react, tailwind, responsive"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Separate tags with commas. Component type will be automatically added.
              </p>
            </div>

          

            <div className="grid gap-2">
              <Label htmlFor="code">Full Prompt</Label>
              <Textarea
                id="code"
                placeholder="Paste your code here..."
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                rows={10}
                className="font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Style"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
