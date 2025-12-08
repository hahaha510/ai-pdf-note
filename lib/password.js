/**
 * 密码加密工具
 * 使用 Web Crypto API 进行密码哈希（兼容 Convex 和浏览器）
 */

/**
 * 生成密码哈希（使用 PBKDF2）
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 哈希后的密码（格式：salt$hash）
 */
export async function hashPassword(password) {
  // 生成随机盐值
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 将密码转换为 ArrayBuffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // 导入密钥
  const keyMaterial = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, [
    "deriveBits",
  ]);

  // 使用 PBKDF2 生成哈希
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // 迭代次数
      hash: "SHA-256",
    },
    keyMaterial,
    256 // 输出位数
  );

  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // 返回格式：salt$hash
  return `${saltHex}$${hashHex}`;
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hashedPassword - 哈希后的密码（格式：salt$hash）
 * @returns {Promise<boolean>} 密码是否匹配
 */
export async function verifyPassword(password, hashedPassword) {
  try {
    // 分离盐值和哈希
    const [saltHex, storedHashHex] = hashedPassword.split("$");

    if (!saltHex || !storedHashHex) {
      return false;
    }

    // 将十六进制盐值转换回 Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

    // 将密码转换为 ArrayBuffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // 导入密钥
    const keyMaterial = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, [
      "deriveBits",
    ]);

    // 使用相同的盐值和参数生成哈希
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    // 转换为十六进制字符串
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // 比较哈希
    return hashHex === storedHashHex;
  } catch (error) {
    console.error("密码验证失败:", error);
    return false;
  }
}
