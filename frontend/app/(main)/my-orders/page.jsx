import MyOrders from "@/app/components/MyOrders"

export const metadata = {
    title: "Mutual - My Orders",
    description: "Your order history.",
}

export default function MyOrdersPage() {
    return (
        <main className="flex flex-col gap-6 py-6 max-w-4xl mx-auto w-full">
            <div className="border-b border-gray-500 pb-2">
                <h1 className="text-3xl xl:text-4xl font-semibold">My Orders</h1>
            </div>
            <MyOrders />
        </main>
    )
}
