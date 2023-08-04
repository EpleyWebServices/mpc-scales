const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.render("index"));
router.get("/download", (req, res) => res.render("download"));
router.get("/contact", (req, res) => res.render("contact"));
router.get("/faq", (req, res) => res.render("faq"));
router.get("/scales/:scale", (req, res) =>
  res.render("scales", {
    scaleFilePath: "partials" + req.url.replace(".pgm", "") + ".ejs",
  })
);

module.exports = router;
