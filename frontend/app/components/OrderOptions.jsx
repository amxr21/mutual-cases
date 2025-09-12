import { OrderOption } from "."

function OrderOptions() {
    const text = [
        { i: 'gift', p: 'Make this a gift' },
        { i: 'note', p: 'Leave a note' },
    ]


  return (
    <div className="flex flex-col xl:flex-row w-full gap-2 xl:gap-3">
        {
            text.map((t, indx) => {
                return <OrderOption key={indx} icon={t.i} text={t.p} />
            })
        }
    </div>
  )
}

export default OrderOptions