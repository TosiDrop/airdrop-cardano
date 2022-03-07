import { useState, useEffect, useCallback } from "react";
import { Upload, Button } from "@arco-design/web-react";
import { UploadItem } from "@arco-design/web-react/es/Upload";
import { useDispatch } from "react-redux";
import { updateAddressArray } from "reducers/globalSlice";
import "./index.scss";

export default function FileUpload() {
  const [fileList, setFileList] = useState<UploadItem[]>([]);
  const dispatch = useDispatch();

  const parseFile = useCallback(() => {
    const reader = new FileReader();
    const file = fileList[0].originFile as Blob;
    reader.readAsText(file);
    reader.onload = function () {
      const addressAmountParsed = csvToArray(reader.result as string);
      const { addressArray, amountArray } =
        splitAmountArray(addressAmountParsed);
      dispatch(updateAddressArray(addressArray));
    };
  }, [dispatch, fileList]);

  useEffect(() => {
    if (!fileList.length) return;
    parseFile();
  }, [fileList, dispatch, parseFile]);

  return (
    <Upload
      showUploadList={false}
      className="file-upload"
      fileList={fileList}
      onChange={setFileList}
      accept=".csv"
    >
      <Button>Add addresses</Button>
    </Upload>
  );
}

function csvToArray(csv: string): string[] {
  const parsedCsv = csv.split("\r\n");
  if (parsedCsv[parsedCsv.length - 1] === "") parsedCsv.pop();
  return parsedCsv;
}

function splitAmountArray(addressAmountParsed: string[]): {
  addressArray: string[];
  amountArray: number[];
} {
  const addressArray: string[] = [];
  const amountArray: number[] = [];
  let temp: string[] = [];
  for (let addressAmountInfo of addressAmountParsed) {
    temp = addressAmountInfo.split(",");
    addressArray.push(temp[0]);
    amountArray.push(Number(Number(temp[1]).toFixed(2)));
  }
  return {
    addressArray,
    amountArray,
  };
}
