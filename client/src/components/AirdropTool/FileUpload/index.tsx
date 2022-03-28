import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { setAddressArray } from "reducers/globalSlice";
import useDualThemeClassBtn from "hooks/useDualThemeClassBtn";
import usePopUp from "hooks/usePopUp";
import { csvToArray, splitAmountArray } from "./helper";

export default function FileUpload() {
  const file = useRef<any>(null);
  const [fileParsed, setFileParsed] = useState(false);
  const dispatch = useDispatch();
  const { setPopUpError } = usePopUp();

  const parseFile = () => {
    try {
      const uploadedFile = file.current.files[0];
      const reader = new FileReader();
      reader.readAsText(uploadedFile);
      reader.onload = function () {
        const addressAmountParsed = csvToArray(reader.result as string);
        const addressAmountArray = splitAmountArray(addressAmountParsed);
        dispatch(setAddressArray(addressAmountArray));
        setFileParsed(true);
      };
    } catch (e) {
      setPopUpError("File format is incorrect");
    }
  };

  return (
    <>
      <input
        ref={file}
        id="file-upload"
        type="file"
        accept=".csv"
        onChange={() => parseFile()}
        hidden
      />
      <label className={useDualThemeClassBtn()} htmlFor="file-upload">
        {fileParsed ? "Upload new addresses" : "Upload addresses"}
      </label>
    </>
  );
}
