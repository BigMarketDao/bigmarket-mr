import express from "express";
import { getConfig } from "../../lib/config";
import axios from "axios";

const router = express.Router();

const SCOPES = "email profile";

router.get("/auth-url/:nonce", (req, res, next) => {
  const nonce = req.params.nonce;
  console.log("auth nonce: " + nonce);
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${getConfig().g_client_id}&` +
    //`response_type=id_token&` +
    `redirect_uri=${encodeURIComponent(getConfig().g_redirect_uris)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `nonce=${encodeURIComponent(nonce)}`;
  console.log("auth url: " + authUrl);
  res.json({ url: authUrl });
});

router.get("/token/verify", async (req, res) => {
  const { code } = req.query;
  const params = {
    code,
    client_id: `${getConfig().g_client_id}`,
    client_secret: `${getConfig().g_client_secret}`,
    redirect_uri: `${getConfig().g_redirect_uris}`,
    grant_type: "authorization_code",
  };
  console.log("/token/verify: params: ", params);

  const tokenResponse = await axios.post(
    "https://oauth2.googleapis.com/token",
    params
  );

  console.log(
    "/token/verify: g_javascript_origins: " + getConfig().g_javascript_origins
  );
  const accessToken = tokenResponse.data.access_token;
  const redirectUrl = `${
    getConfig().g_javascript_origins
  }/auth/callback?token=${encodeURIComponent(accessToken)}`;
  console.log("/token/verify: accessToken: " + accessToken);
  console.log("/token/verify: redirectUrl: " + redirectUrl);
  res.redirect(redirectUrl);
});
export { router as jwtRoutes };
