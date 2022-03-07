import { useSelector, RootStateOrAny } from "react-redux";
import { AddressAmount } from 'utils'
import "./index.scss";

export default function AddressList() {
  const COMPONENT_CLASS = "address-list";
  const { addressArray } = useSelector((state: RootStateOrAny) => state.global);
  return addressArray.length ? (
    <div className={`${COMPONENT_CLASS}`}>
      <div className={`${COMPONENT_CLASS}__status`}>
        {addressArray.length} address added
      </div>
      <div className={`${COMPONENT_CLASS}__list`}>
        {addressArray.map(({ address, amount }: AddressAmount, i: number) => (
          <div key={i}>{`addr1...${address.slice(address.length - 8)}: ${amount}`}</div>
        ))}
      </div>
    </div>
  ) : null;
}
