import { useSelector, RootStateOrAny } from "react-redux";
import { AddressAmountMap, shortenAddress } from "utils";
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
        {addressArray.map(
          ({ address, amount }: AddressAmountMap, i: number) => (
            <div key={i}>{`${shortenAddress(address)}: ${amount}`}</div>
          )
        )}
      </div>
    </div>
  ) : null;
}
