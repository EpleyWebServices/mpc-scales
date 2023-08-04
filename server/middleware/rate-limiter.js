const RateLimit = require("express-rate-limit");

module.exports = new RateLimit({
  windowMs: 60000 * 60, // 1 hour
  max: 200, // limit each IP to 5 error connections per windowMs
  delayMs: 0, // using express slow-down to handle response throttling already
  skipSuccessfulRequests: false,
  message: "Rate limit exceeded.",
  handler: (req, res /* next */) => {
    console.log(req.ip + " reached their rate limit...");
    return res.render("error", {
      error:
        "Server request rate exceeded. Please wait a while before sending further requests!",
    });
  },
});
