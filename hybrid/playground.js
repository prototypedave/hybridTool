import { IPinfoWrapper } from "node-ipinfo";

const ipinfo = new IPinfoWrapper("69a7f3d8d38d29");

const ips = ["1.1.1.1", "8.8.8.8", "1.2.3.4/country"]; 
ipinfo.getBatch(ips).then((response) => {
    console.log(response);
});