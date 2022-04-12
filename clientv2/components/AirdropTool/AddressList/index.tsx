import { useSelector, RootStateOrAny } from "react-redux";
import { AddressAmount, shortenAddress } from "utils";

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
          <div key={i}>{`${shortenAddress(address)}: ${amount.toFixed(
            2
          )}`}</div>
        ))}
      </div>
    </div>
  ) : null;
}
