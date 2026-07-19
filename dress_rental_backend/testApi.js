import axios from 'axios';

axios.get('http://localhost:4000/payment/orders/athiya160@gmail.com')
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(err => console.log("ERROR:", err.response ? err.response.data : err.message));
