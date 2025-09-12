import { Header, MainSection, DiscoverProducts } from '../components';



async function Discover() {
    return (
        <MainSection classes="gap-10">
            <Header key='Discover' headerText='Our Products' subheader={true} subheaderText={`Flexible. Secure. Instantly ready. \n Designed to stand, fold, and flex around your workflow — wherever that takes you`} mark={true} markClasses='-top-6 left-[30%] xl:left-0 w-36 xl:w-fit xl:inset-x-0 xl:flex xl:justify-center' textAlignment='center' />
            <div className="products grid xl:grid-cols-3 gap-10">
                <DiscoverProducts />
            </div>
        </MainSection>
  )
}

export default Discover