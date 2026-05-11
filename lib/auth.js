import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cosy-admin-secret-change-me-in-prod"
);
const COOKIE = "cosy_admin_token";

const CREDENTIALS = {
  login: process.env.ADMIN_LOGIN || "admin",
  password: process.env.ADMIN_PASSWORD || "cosy2025",
};

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function checkCredentials(login, password) {
  return login === CREDENTIALS.login && password === CREDENTIALS.password;
}

export { COOKIE };
