require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { google } = require("googleapis");
const { ConfidentialClientApplication } = require("@azure/msal-node");
const crypto = require("node:crypto");
const path = require("node:path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const isProduction = process.env.NODE_ENV === "production";
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(session({
  name: "memail.sid",
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: isProduction, sameSite: "lax", maxAge: 8 * 60 * 60 * 1000 }
}));

// Prototype adapter: tokens stay on the server, never in browser storage.
// Use a persistent, encrypted session/token store before public production deployment.
const googleTokens = new Map();
const microsoftTokens = new Map();
const states = new Map();

const googleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const msConfigured = () => Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET && process.env.MICROSOFT_TENANT_ID);
function googleClient() {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${BASE_URL}/auth/google/callback`);
}
function msClient() {
  return new ConfidentialClientApplication({
    auth: { clientId: process.env.MICROSOFT_CLIENT_ID, authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`, clientSecret: process.env.MICROSOFT_CLIENT_SECRET }
  });
}
function requireGoogle(req, res, next) {
  const token = googleTokens.get(req.sessionID);
  if (!token) return res.status(401).json({ error: "Connect a Google mailbox first." });
  req.googleAuth = googleClient();
  req.googleAuth.setCredentials(token);
  next();
}
function requireMicrosoft(req, res, next) {
  const token = microsoftTokens.get(req.sessionID);
  if (!token || !token.accessToken || token.expiresOn && token.expiresOn < Date.now()) return res.status(401).json({ error: "Connect a Microsoft mailbox first or reconnect it." });
  req.msToken = token.accessToken;
  next();
}
app.get("/api/status", (req, res) => res.json({
  mode: "backend-preview",
  googleConfigured: googleConfigured(),
  microsoftConfigured: msConfigured(),
  googleConnected: googleTokens.has(req.sessionID),
  microsoftConnected: microsoftTokens.has(req.sessionID),
  note: "This prototype keeps OAuth tokens in server memory. A server restart disconnects accounts."
}));

app.get("/auth/google", (req, res) => {
  if (!googleConfigured()) return res.status(503).send("Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server environment.");
  const state = crypto.randomBytes(24).toString("hex");
  states.set(req.sessionID, { provider: "google", state, created: Date.now() });
  res.redirect(googleClient().generateAuthUrl({
    access_type: "offline", prompt: "consent", state,
    scope: ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"]
  }));
});
app.get("/auth/google/callback", async (req, res) => {
  try {
    const expected = states.get(req.sessionID); states.delete(req.sessionID);
    if (!expected || expected.provider !== "google" || req.query.state !== expected.state) return res.status(400).send("OAuth state check failed. Please restart sign-in.");
    if (req.query.error) return res.status(400).send("Google sign-in was cancelled or denied.");
    const { tokens } = await googleClient().getToken(String(req.query.code || ""));
    googleTokens.set(req.sessionID, tokens);
    res.redirect("/?connected=google");
  } catch (e) { console.error("Google OAuth callback failed", e.message); res.status(500).send("Google sign-in failed. Check server configuration and redirect URI."); }
});
app.get("/api/google/messages", requireGoogle, async (req, res) => {
  try {
    const gmail = google.gmail({ version: "v1", auth: req.googleAuth });
    const result = await gmail.users.messages.list({ userId: "me", maxResults: Math.min(50, Math.max(1, Number(req.query.limit || 20))), q: String(req.query.q || "") });
    const messages = await Promise.all((result.data.messages || []).map(async item => {
      const m = await gmail.users.messages.get({ userId: "me", id: item.id, format: "metadata", metadataHeaders: ["From", "To", "Subject", "Date"] });
      const headers = Object.fromEntries((m.data.payload.headers || []).map(h => [h.name.toLowerCase(), h.value]));
      return { id: m.data.id, threadId: m.data.threadId, snippet: m.data.snippet || "", from: headers.from || "", to: headers.to || "", subject: headers.subject || "(no subject)", date: headers.date || "", unread: (m.data.labelIds || []).includes("UNREAD"), starred: (m.data.labelIds || []).includes("STARRED"), labels: m.data.labelIds || [] };
    }));
    res.json({ messages, nextPageToken: result.data.nextPageToken || null });
  } catch (e) { console.error("Gmail list failed", e.message); res.status(502).json({ error: "Could not read Gmail. Reconnect and check the Gmail API permissions." }); }
});
app.post("/api/google/send", requireGoogle, async (req, res) => {
  const { to, subject, body } = req.body || {};
  if (typeof to !== "string" || !to.includes("@") || typeof subject !== "string" || typeof body !== "string") return res.status(400).json({ error: "A valid recipient, subject, and message body are required." });
  const safe = v => String(v).replace(/[\r\n]+/g, " ").trim();
  const rawMessage = [`To: ${safe(to)}`, `Subject: ${safe(subject)}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "", body].join("\r\n");
  const raw = Buffer.from(rawMessage, "utf8").toString("base64url");
  try { const gmail = google.gmail({ version: "v1", auth: req.googleAuth }); const sent = await gmail.users.messages.send({ userId: "me", requestBody: { raw } }); res.json({ ok: true, id: sent.data.id, threadId: sent.data.threadId }); }
  catch (e) { console.error("Gmail send failed", e.message); res.status(502).json({ error: "Gmail could not send this message." }); }
});

app.get("/auth/microsoft", async (req, res) => {
  if (!msConfigured()) return res.status(503).send("Microsoft OAuth is not configured. Add MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET and MICROSOFT_TENANT_ID.");
  const state = crypto.randomBytes(24).toString("hex");
  states.set(req.sessionID, { provider: "microsoft", state, created: Date.now() });
  try { const url = await msClient().getAuthCodeUrl({ scopes: ["openid", "profile", "email", "offline_access", "User.Read", "Mail.Read", "Mail.Send"], redirectUri: `${BASE_URL}/auth/microsoft/callback`, state }); res.redirect(url); }
  catch (e) { console.error("Microsoft auth URL failed", e.message); res.status(500).send("Could not start Microsoft sign-in."); }
});
app.get("/auth/microsoft/callback", async (req, res) => {
  try {
    const expected = states.get(req.sessionID); states.delete(req.sessionID);
    if (!expected || expected.provider !== "microsoft" || req.query.state !== expected.state) return res.status(400).send("OAuth state check failed. Please restart sign-in.");
    if (req.query.error) return res.status(400).send("Microsoft sign-in was cancelled or denied.");
    const result = await msClient().acquireTokenByCode({ code: String(req.query.code || ""), scopes: ["User.Read", "Mail.Read", "Mail.Send"], redirectUri: `${BASE_URL}/auth/microsoft/callback` });
    microsoftTokens.set(req.sessionID, { accessToken: result.accessToken, expiresOn: result.expiresOn ? result.expiresOn.getTime() : Date.now() + 300000, account: result.account });
    res.redirect("/?connected=microsoft");
  } catch (e) { console.error("Microsoft OAuth callback failed", e.message); res.status(500).send("Microsoft sign-in failed. Check app registration and redirect URI."); }
});
app.get("/api/microsoft/messages", requireMicrosoft, async (req, res) => {
  try {
    const url = new URL("https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages");
    url.searchParams.set("$top", String(Math.min(50, Math.max(1, Number(req.query.limit || 20)))));
    url.searchParams.set("$select", "id,conversationId,subject,from,toRecipients,receivedDateTime,bodyPreview,isRead,importance");
    if (req.query.q) url.searchParams.set("$search", `"${String(req.query.q).replace(/["\\]/g, "")}"`);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${req.msToken}`, ConsistencyLevel: "eventual" } });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: "Microsoft Graph could not read the inbox." });
    res.json({ messages: (data.value || []).map(m => ({ id: m.id, threadId: m.conversationId, subject: m.subject || "(no subject)", from: m.from?.emailAddress?.address || "", snippet: m.bodyPreview || "", date: m.receivedDateTime || "", unread: !m.isRead, importance: m.importance })), nextLink: data["@odata.nextLink"] || null });
  } catch (e) { console.error("Microsoft inbox failed", e.message); res.status(502).json({ error: "Could not read Microsoft mailbox." }); }
});
app.post("/api/microsoft/send", requireMicrosoft, async (req, res) => {
  const { to, subject, body } = req.body || {};
  if (typeof to !== "string" || !to.includes("@") || typeof subject !== "string" || typeof body !== "string") return res.status(400).json({ error: "A valid recipient, subject, and message body are required." });
  try {
    const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", { method: "POST", headers: { Authorization: `Bearer ${req.msToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: { subject, body: { contentType: "Text", content: body }, toRecipients: [{ emailAddress: { address: to } }] }, saveToSentItems: true }) });
    if (!response.ok) return res.status(502).json({ error: "Microsoft could not send this message." });
    res.json({ ok: true });
  } catch (e) { console.error("Microsoft send failed", e.message); res.status(502).json({ error: "Microsoft send failed." }); }
});
app.post("/auth/disconnect/:provider", (req, res) => {
  if (req.params.provider === "google") googleTokens.delete(req.sessionID);
  else if (req.params.provider === "microsoft") microsoftTokens.delete(req.sessionID);
  else return res.status(404).json({ error: "Unknown provider." });
  res.json({ ok: true });
});
app.get("/health", (_, res) => res.json({ ok: true }));
app.use(express.static(path.join(__dirname, "..")));
app.listen(PORT, () => console.log(`MeMail API listening on ${BASE_URL}`));
