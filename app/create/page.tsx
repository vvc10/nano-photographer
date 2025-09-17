"use client"

import { useRouter } from "next/navigation"
import { CreatePinModal } from "@/components/pin/create-pin-modal"

export default function CreateStylePage() {
  const router = useRouter()

  return (
    <main className="container mx-auto px-4 py-6">
      <CreatePinModal
        open={true}
        onOpenChange={(open) => {
          if (!open) router.back()
        }}
      />
    </main>
  )
}
