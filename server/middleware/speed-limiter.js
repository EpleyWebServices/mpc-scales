const slowDown = require("express-slow-down");

module.exports = slowDown({
  windowMs: 60 * 60 * 1000, // 1 hr
  delayAfter: 100, // allow 100 requests to go at full-speed
  delayMs: 25, // ms to add to cumulative delay length
  skipSuccessfulRequests: false, // when true successful requests (response status < 400) won't be counted. Defaults to false
  onLimitReached: (req, res /* next */) => {
    console.log(req.ip + " reached their speed limit...");
    return res.render("error", {
      error:
        "Server request rate exceeded. Please wait a while before sending further requests!",
    });
  },
});
