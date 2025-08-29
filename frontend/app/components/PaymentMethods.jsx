import { Visa, MasterCard, GooglePay, ApplePay  } from "../constants/imags"

function PaymentMethods() {
  return (
    <div className="flex gap-5 items-center">
        <Visa />
        <MasterCard />
        <ApplePay />
        <GooglePay />
    </div>
  )
}

export default PaymentMethods