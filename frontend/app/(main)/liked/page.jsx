import LikedProducts from "@/app/components/LikedProducts"

export const metadata = {
    title: "Mutual - Liked",
    description: "Your saved cases",
}

export default function LikedPage() {
    return (
        <main className="flex flex-col gap-6 py-6">
            <div className="flex items-center justify-between border-b border-gray-500 pb-2">
                <h1 className="text-3xl xl:text-4xl font-semibold">Your Liked Items</h1>
            </div>
            <LikedProducts />
        </main>
    )
}
