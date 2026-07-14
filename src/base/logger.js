const moment = require("moment");
module.exports = class Logger {
  static log (content, type = "log") {
    const timestamp = `[${moment().format("YYYY-MM-DD HH:mm:ss")}]`;
    switch (type) {

    case "log": {
      return console.log(`${timestamp} • [ Log ] ` + "      => " + content);
    }
    case "warn": {
      return console.log(`${timestamp} • [ Warn ] ` + "      => " + content);
    }
    case "error": {
      return console.log(`${timestamp} • [ Error ] ` + "      => " + content);
    }
    case "debug": {
      return console.log(`${timestamp} • [ Debug ] ` + "      => " + content);
    }
    case "cmd": {
      return console.log(`${timestamp} • [ Commands ] ` + "      => " + content);
    }
    case "event": {
      return console.log(`${timestamp} • [ Event ] ` + "      => " + content);
    }
    case "ready": {
      return console.log(`${timestamp} • [ Ready ] ` + "      => " + content);
    } 
    default: throw new TypeError("Logger type must be either warn, debug, log, ready, cmd or error.");
    }
  }
};