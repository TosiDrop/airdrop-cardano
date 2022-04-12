// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  axios.get('http://tosidrop-server:3000')
    .then(response => {
      return res.status(200).json({ name: response.data.name });
    })
}
