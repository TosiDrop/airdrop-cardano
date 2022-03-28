import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { setAddressArray } from "reducers/globalSlice";
import { AddressAmount } from "utils";
import useDualThemeClassBtn from "hooks/useDualThemeClassBtn";
import usePopUp from "hooks/usePopUp";

export default function FileUpload() {
  const file = useRef<any>(null)
  const [fileParsed, setFileParsed] = useState(false)
  const dispatch = useDispatch();
  const { setPopUpError } = usePopUp()

  const parseFile = () => {
    try {
      const uploadedFile = file.current.files[0]
      const reader = new FileReader();
      reader.readAsText(uploadedFile);
      reader.onload = function () {
        const addressAmountParsed = csvToArray(reader.result as string);
        const addressAmountArray = splitAmountArray(addressAmountParsed);
        dispatch(setAddressArray(addressAmountArray));
        setFileParsed(true)
      };
    } catch (e) {
      setPopUpError('File format is incorrect')
    }
  }

  const handleUploadClick = () => {
    if (fileParsed) {
      file.current.value = null
      dispatch(setAddressArray([]));
    }
  }

  return (
    <>
    <input ref={file} id="file-upload" type='file' accept=".csv" onChange={() => parseFile()} hidden/>
    <label className={useDualThemeClassBtn()} htmlFor="file-upload">
      {
        fileParsed ? 'Upload new addresses' : 'Upload addresses'
      }
    </label>
    </>
  );
}

function csvToArray(csv: string): string[] {
  csv = csv.replaceAll("\r", ""); // for windows line ending
  const parsedCsv = csv.split("\n");
  if (parsedCsv[parsedCsv.length - 1] === "") parsedCsv.pop();
  return parsedCsv;
}

function splitAmountArray(addressAmountParsed: string[]): AddressAmount[] {
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
}
