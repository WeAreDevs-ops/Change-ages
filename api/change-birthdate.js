const https = require("https");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { cookie, password } = req.body;
  if (!cookie || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const csrfToken = await getCsrf(cookie);

    const payload = JSON.stringify({
      birthday: "2005-01-01", // set to desired 13+ birthdate
      password
    });

    const options = {
      method: "PATCH",
      hostname: "accountsettings.roblox.com",
      path: "/v1/birthdate",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "Cookie": `.ROBLOSECURITY=${cookie}`,
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const result = await sendRequest(options, payload);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

function getCsrf(cookie) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      method: "POST",
      hostname: "auth.roblox.com",
      path: "/v2/logout",
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`
      }
    }, (res) => {
      const token = res.headers['x-csrf-token'];
      if (token) resolve(token);
      else reject(new Error("Failed to get CSRF token"));
    });
    req.on("error", reject);
    req.end();
  });
}

function sendRequest(options, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
      }
