import WarrantyFeature from "./WarrantyFeature"

function WarrantyBanner() {
  const text = [
    { h: 'Hassle-Free Refunds', p: 'Not satisfied? Return within 7 days — no questions asked.' },
    { h: '30-Day Warranty', p: 'Covers defects or issues — we’ve got you protected.' },
    { h: '24/7 Customer Support', p: 'available around the clock to assist you — anytime, any day.' },
  ]
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 -mx-8 xl:-mx-20 px-10 xl:px-20 py-6 gap-4 text-center xl:text-left xl:gap-2 bg-blue opacity-70 text-off-white mt-20 mb-28">
      {
        text.map((f, indx) => {
          return  <WarrantyFeature key={indx} header={f.h} para={f.p} />
        })
      }
    </div>
  )
}

export default WarrantyBanner