import { Router } from "express";

// Create a new instance of the Express Router
const RaydiumSnipingRoute = Router();

RaydiumSnipingRoute.get("/", async (req, res) => {
  res.send({msg : "GET Raydium Sniping Bot"})
});

RaydiumSnipingRoute.post("/startbot", async (req, res) => {
  console.log(req.body)
  res.send({msg : "sucess"})
});


RaydiumSnipingRoute.get("/:subdomain", async (req, res) => {
  console.log("token creating");

  const { subdomain } = req.params;
});

export default RaydiumSnipingRoute;