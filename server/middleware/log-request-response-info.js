module.exports = function logRequestResponseInfo(isProd, server) {
  if (!isProd) {
    server.use((req, res, next) => {
      var ts = new Date();
      try {
        console.log(
          "[ " + req.method + ": " + req.path + ": " + ts.toUTCString() + " ]"
        );
      } catch (err) {
        console.log(
          "[ " + req.method + ": " + req.path + ": " + ts.toUTCString() + " ]"
        );
      }
      next();
    });
  }
};
