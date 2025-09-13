import { Header, MainSection, DiscoverProducts } from '../components';



async function Discover() {
    return (
        <MainSection classes="gap-10">
            <Header key='Discover' headerText='Our Products' subheader={true} subheaderText={`Flexible. Secure. Instantly ready. \n Designed to stand, fold, and flex around your workflow — wherever that takes you`} mark={true} markClasses='-top-6 xl:-top-10 left-[30%] xl:left-10 w-36 xl:w-full xl:flex xl:justify-center' textAlignment='center' />
            <div className="products grid xl:grid-cols-3 gap-10">
                <DiscoverProducts />
            </div>
        </MainSection>
  )
}

export default Discover