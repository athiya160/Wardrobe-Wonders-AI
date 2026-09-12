import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
export const initPayment = async (dress, quantity, address, startDate = null, endDate = null, totalAmount = null) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user || !user.email) {
    alert("Please Login to continue");
    return;
  }
  try {
    const reqData = {
      dress,
      quantity,
      email: user.email,
      startDate,
      endDate,
      totalAmount,
      address,
    };
    const response = await axios.post(`${BASE_URL}/payment`, reqData);
    const data = response.data;
    if (data.success) {
      localStorage.setItem("tID", data.data.merchantTransactionId);
      localStorage.setItem("dressId", dress._id);
      localStorage.setItem("quantity", quantity);
      if (startDate) localStorage.setItem("startDate", startDate);
      if (endDate) localStorage.setItem("endDate", endDate);
      if (totalAmount != null) localStorage.setItem("totalAmount", totalAmount);
      localStorage.setItem("address", JSON.stringify(address));
      window.location.href = data.data.instrumentResponse.redirectInfo.url;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
