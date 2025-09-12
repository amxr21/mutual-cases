import ShippingFeature from './ShippingFeature'
import { Star, Lightining, Truck } from '../constants/icons'

function ShippingFeatures() {
    const features = [
        {icon: Star, text: 'Next-Day UAE Delivery'},
        {icon: Lightining, text: 'Fast Local Shipping'},
        {icon: Truck, text: 'Premium Quality & Service'},
    ]
    return (
        <div className='flex flex-col xl:flex-row gap-3 justify-between w-full mt-4'>
            {
                features.map((feature, indx) => {
                    return <ShippingFeature key={indx} icon={feature.icon} text={feature.text} />
                })
            }
        </div>
  )
}

export default ShippingFeatures