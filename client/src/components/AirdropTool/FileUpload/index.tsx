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
      let addresses = reader.result as string;
      const addressArray = addresses!.split("\r\n");
      if (addressArray[addressArray.length - 1] === "") addressArray.pop();
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
