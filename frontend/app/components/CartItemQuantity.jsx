import { Dropdown } from 'primereact/dropdown';
import { Button, } from '.';

function CartItemQuantity({ count, countFunc }) {
  return (
    <div className="quantity flex flex-col gap-1 justify-between">
        <Dropdown 
            value={count}
            onChange={(e) => countFunc(e.target.value)}
            className="w-full bg-off-white text-off-black py-1 px-2 rounded-md flex gap-4 h-full items-center" 
            options={[1,2,3,4,5,6,7,8,9,10]}
            optionLabel="name" 
            panelClassName='px-2 py-1 bg-off-white text-off-black mt-1 border-off-black rounded-md'
            placeholder="1"
        />
        <Button type='text' buttonContent='X | Remove' classes={'bg-transparent h-full px-2 py-1'} handleClick={() => {countFunc(0)}} />
    </div>
  )
}

export default CartItemQuantity