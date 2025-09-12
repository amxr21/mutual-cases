import { Header, MainSection, DiscoverProducts } from '../components';



async function Discover() {
    return (
        <MainSection classes="">
            <Header key='Discover' headerText='Our Products' subheader={true} subheaderText={`Flexible. Secure. Instantly ready. \n Designed to stand, fold, and flex around your workflow — wherever that takes you`} mark={true} markClasses='-top-10 inset-x-0 flex justify-center' textAlignment='center' />
            <div className="products grid grid-cols-3 gap-10">
                <DiscoverProducts />
            </div>
        </MainSection>
  )
}

export default Discover