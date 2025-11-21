// To run this test make sure to install k6 on your machine
// and run "k6 run load-test.js".

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { sleep } from "k6";
import http from "k6/http";

export const options = {
  noConnectionReuse: false,
  insecureSkipTLSVerify: true, //locally
  // vus: 1, //virtual users
  // duration: '30s' //seconds running
  stages: [
    {
      duration: "10s",
      target: 50,
    },
    {
      duration: "10s",
      target: 200,
    },
    {
      duration: "10s",
      target: 200,
    },
    {
      duration: "10s",
      target: 200,
    },
    {
      duration: "10s",
      target: 50,
    },
  ],
  thresholds: {
    http_req_duration: ["p(99)<150"],
  },
};

export default () => {
  http.get("http://localhost:3000/api/stake-out");
  sleep();
};
