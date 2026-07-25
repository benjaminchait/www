const crypto = require("crypto");

module.exports = (() => {
  const { MAPKIT_TEAM_ID, MAPKIT_KEY_ID, MAPKIT_PRIVATE_KEY_B64 } = process.env;
  if (!MAPKIT_TEAM_ID || !MAPKIT_KEY_ID || !MAPKIT_PRIVATE_KEY_B64) return null;

  try {
    const pem = Buffer.from(MAPKIT_PRIVATE_KEY_B64, "base64").toString("utf8");
    const privateKey = crypto.createPrivateKey(pem);

    const b64url = (input) =>
      Buffer.from(input).toString("base64")
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const header = { alg: "ES256", kid: MAPKIT_KEY_ID, typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: MAPKIT_TEAM_ID,
      iat: now,
      exp: now + 60 * 60 * 24 * 180, // ~180 days; token is baked at build time and re-signed on each deploy
      // no `origin` claim: intentionally unrestricted for this demo/test branch
    };

    const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;

    // dsaEncoding must be 'ieee-p1363' (raw 64-byte R||S) -- JWS/ES256 per
    // RFC 7518 requires this, not Node's default DER/ASN.1 encoding.
    const signature = crypto.sign("sha256", Buffer.from(signingInput), {
      key: privateKey,
      dsaEncoding: "ieee-p1363",
    });

    return `${signingInput}.${b64url(signature)}`;
  } catch (err) {
    console.warn("[mapkitToken] failed to generate token, maps will be skipped:", err.message);
    return null;
  }
})();
