import { CheckoutForm } from "@/app/components"

export const metadata = {
    title: "Mutual - Checkout",
    description: "Complete your order.",
}

export default function CheckoutPage() {
    return (
        <main className="flex flex-col gap-6 py-6">
            <div className="border-b border-gray-500 pb-2">
                <h1 className="text-3xl xl:text-4xl font-semibold">Checkout</h1>
            </div>
            <CheckoutForm />
        </main>
    )
}
