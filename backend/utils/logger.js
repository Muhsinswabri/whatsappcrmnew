const log = (message, data = "") => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] [INFO] ${message}`, data);
  } else {
    console.log(`[${timestamp}] [INFO] ${message}`);
  }
};

const error = (message, err = "") => {
  const timestamp = new Date().toISOString();
  if (err) {
    console.error(`[${timestamp}] [ERROR] ${message}`, err.message || err);
  } else {
    console.error(`[${timestamp}] [ERROR] ${message}`);
  }
};

module.exports = {
  log,
  error,
};
