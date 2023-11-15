import axios from "axios";

import { Component } from "../types";

export const fetchComponents = async () => {
  const { data } = await axios.get<Component[]>("https://ui-thing.behonbaker.com/api/components");
  return data;
};
