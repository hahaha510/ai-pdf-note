import { SignJWT, jwtVerify } from "jose";

// 从环境变量获取密钥，确保至少32字符
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-please-change-this-in-production-min-32-chars"
);

/**
 * 创建 JWT Token
 * @param {Object} payload - 要编码的数据（userId, email 等）
 * @returns {Promise<string>} JWT token
 */
export async function createToken(payload) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // 7天过期
      .sign(secret);

    return token;
  } catch (error) {
    console.error("创建 token 失败:", error);
    throw new Error("Token 创建失败");
  }
}

/**
 * 验证 JWT Token
 * @param {string} token - 要验证的 token
 * @returns {Promise<Object|null>} 解码后的 payload 或 null
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("Token 验证失败:", error.message);
    return null;
  }
}

/**
 * 刷新 Token（可选功能）
 * @param {string} oldToken - 旧的 token
 * @returns {Promise<string|null>} 新的 token 或 null
 */
export async function refreshToken(oldToken) {
  const payload = await verifyToken(oldToken);

  if (!payload) {
    return null;
  }

  // 创建新 token，移除旧的时间戳
  // eslint-disable-next-line no-unused-vars
  const { iat, exp, ...userData } = payload;
  return await createToken(userData);
}
