import { MainSection, Header, Info } from '../components'

import { HeartIcon, BoxIcon, AimIcon } from '../constants/icons'

function Unique() {

    const text = {
        'en': [
            { icon: AimIcon, h: "Youth-First Design", p: "Everything we make starts with real needs — slim profiles, clean looks, and bold colors built for daily use. No fluff. Just function." },
            { icon: BoxIcon, h: "Fast. Friendly. Always Ready.", p: "From browsing to checkout to delivery, we keep it smooth, quick, and easy. No hassle, just hustle." },
            { icon: HeartIcon, h: "Mutual Isn’t Just a Name", p: "It’s our mindset: balance, connection, and purpose. We design with you, for you — every step of the way." },
        ]
    }


  return (
    <MainSection Id={"Unique"} classes="banner gap-8 xl:gap-0 -mx-8 xl:-mx-20 px-10 xl:px-20 py-6 py-12 mb-20 xl:mb-40">
        <Header headerText='What Sets Us Apart' subheader={true} subheaderText='We don’t just sell covers — we create everyday essentials designed to move with you. Here’s what makes Mutual different:' textAlignment='center' textColor='white' />

        <div className="info's grid xl:grid-cols-3 gap-10 xl:gap-2">
            {
                text['en'].map((info, indx) => {
                    return (
                        <Info key={indx} icon={info.icon} header={info.h} description={info.p} />
                    )
                })
            }
        </div>
    </MainSection>
  )
}

export default Unique