const { Router } = require("express");
const { middlewere } = require("../../../middleware/auth");
const {
  comm,
  update,
  deleteComment,
  getAllComments,
} = require("../../../controllers/app/user/comment");

const route = Router();

route.post("/create-post/:id", middlewere, comm);
route.patch("/update-post/:id", middlewere, update);
route.delete("/delete-post/:id", middlewere, deleteComment);
route.get("/:id", middlewere, getAllComments);

module.exports = route;
