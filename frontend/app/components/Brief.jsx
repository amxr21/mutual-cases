import Image from "next/image"
import Logo from "../../public/images/logo.png"

import { FooterSection } from "./index"

function Brief() {
  return (
    <FooterSection classes={'flex-col'}>
      <Image src={Logo} alt=""  className="mb-4"/>
      <p className="para-small">More than just a case. Slim, light, optimal, and for You!</p>
    </FooterSection>
  )
}

export default Brief