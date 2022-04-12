import { AddressAmount } from "utils";

export const csvToArray = (csv: string): string[] => {
  csv = csv.replaceAll("\r", ""); // for windows line ending
  const parsedCsv = csv.split("\n");
  if (parsedCsv[parsedCsv.length - 1] === "") parsedCsv.pop();
  return parsedCsv;
};

export const splitAmountArray = (
  addressAmountParsed: string[]
): AddressAmount[] => {
  const res: AddressAmount[] = [];
  let temp: string[] = [];
  for (let addressAmountInfo of addressAmountParsed) {
    temp = addressAmountInfo.split(",");
    res.push({
      address: temp[0],
      amount: Number(Number(temp[1])),
    });
  }
  return res;
};
