const { Router } = require("express");
const multer = require("multer");
const { middlewere } = require("../../../middleware/auth");
const { createRating, gettoprated, getRatings, getRatingsPaginated, updateRating, deleteRating } = require("../../../controllers/app/user/rating");
 
const route = Router();
 
route.post("/", middlewere, createRating);
route.get("/gettoprated",middlewere,gettoprated)
route.get("/getratings",middlewere,getRatings)
route.get("/getratings-paginated",middlewere,getRatingsPaginated)
 
route.put('/edit/:ratingId',middlewere,updateRating);
route.delete('/delete/:ratingId',middlewere,deleteRating);
 
module.exports = route;
 
 