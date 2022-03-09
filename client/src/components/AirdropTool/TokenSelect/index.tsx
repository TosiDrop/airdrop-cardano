import { Select } from "@arco-design/web-react";
import { useSelector, RootStateOrAny, useDispatch } from "react-redux";
import { updateSelectedToken } from "reducers/globalSlice";
import { Token } from "utils";
import "./index.scss";

const Option = Select.Option;

export default function TokenSelect() {
  const {tokenArray, selectedToken} = useSelector(
    (state: RootStateOrAny) => state.global
  );
  const dispatch = useDispatch();

  return (
    <Select placeholder="Select token" showSearch disabled={!tokenArray.length} value={selectedToken.name || undefined}>
      {tokenArray.map((token: Token, index: number) => (
        <Option
          key={index}
          value={token.name}
          onClick={() =>
            dispatch(
              updateSelectedToken({
                name: token.name,
                amount: token.amount,
                decimals: token.decimals,
              })
            )
          }
        >
          {token.name}
        </Option>
      ))}
    </Select>
  );
}
