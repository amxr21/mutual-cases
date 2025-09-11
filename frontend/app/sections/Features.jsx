import { Header, Feature, MainSection } from "../components/index"


function Features() {
    
    const text = {
        'en': [
            { 'magnet': ['Multiple positions', 'Detachable into 2 pieces' , 'Hangable on metal surfaces', 'Supports pencil charging', 'Extra protection' ] },
            { 'simple': ['Combination of 3 pieces', 'Stands in 3 basic positions' , 'Hangable on metal surfaces', 'Supports pencil charging', 'Very light weight' ] },
            { 'light' : ['Stands in 3 basic positions', 'Supports pencil charging' , 'Light weight', 'Perfect for simple, general use' ] },
        ]
    }


  return (
    <MainSection Id="Features" classes="banner items-center bg-blue py-16 px-20 -mx-20 text-white">
        <Header textColor="white" textAlignment="center" headerText="We offer three types of cases" subheaderText="Each has specific functions to match your needs!" subheader={true} mark={false} />
        <ul className="features-details grid grid-cols-3 w-full justify-between">
            {
                text['en'].map((feature, indx) => {
                    let a = Object.entries(feature)[0]
                    // console.log(a);
                    
                    return (
                        <Feature key={indx} index={indx+1} header={a[0]} details={a[1]} />
                    )
                })
                

            }
        </ul>

    </MainSection>
  )
}

export default Features