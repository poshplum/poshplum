let helperClass;

import {PlatformTextEncoder} from "@platform/TextEncoder";
import {PlatformSubtleCrypto} from "@platform/SubtleCrypto";

export class CryptoHelper {
    static async sign(plainText, privateKey) {
        // console.warn({plainText, privateKey}, new Error("stack"));
        if (!privateKey) throw new Error("signing requires a privateKey");
        let plainBuffer = new PlatformTextEncoder("utf-8").encode(plainText);
        let signature = await PlatformSubtleCrypto.sign(
            {
                name: "RSA-PSS",
                saltLength: 128, //the length of the salt
            },
            privateKey,
            plainBuffer
        );

        return signature;
    }
    static async signToHex(plainText, privateKey) {
        return this.array2hex(await this.sign(plainText, privateKey));
    }

    static async verifyHex(plainText, hexSignature, publicKey) {
        let signature = this.hexToArrayBuffer(hexSignature);

        return this.verify(plainText, signature, publicKey);
    }
    static async hash(content, algo = "SHA-256") {
        const encoder = new PlatformTextEncoder();
        const data = encoder.encode(content);
        let result = await PlatformSubtleCrypto.digest(algo, data);

        return this.array2hex(result);
    }

    static async verifyJwk(jwkString) {
        if ("string" !== typeof jwkString) {
            throw new Error("publicKey needs to be stringified");
        }
        let jwk = JSON.parse(jwkString);
        if (!(jwk.kty && jwk.n && jwk.e)) throw new Error("Not a jwk");
        if (jwk.n.length > 683)
            throw new Error("key length > 4096 bits not accepted");
        if (jwk.d) throw new Error("refusing to save a private key");

        const key = await CryptoHelper.importPublicKeyJWK(jwk);
        if (key.algorithm.modulusLength < 2048)
            throw new Error("publicKey needs to be 2048 bits minimum");
        return key;
    }

    static array2hex(buffer) {
        const byteArray = new Uint8Array(buffer);
        const hexCodes = [...byteArray].map((value) => {
            const hexCode = value.toString(16);
            const paddedHexCode = hexCode.padStart(2, "0");
            return paddedHexCode;
        });

        return hexCodes.join("");
    }
    static hexToArrayBuffer(hex) {
        if (typeof hex !== "string") {
            throw new TypeError("Expected input to be a string");
        }

        if (hex.length % 2 !== 0) {
            throw new RangeError(
                "Expected string to be an even number of characters"
            );
        }

        var view = new Uint8Array(hex.length / 2);

        for (var i = 0; i < hex.length; i += 2) {
            view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }

        return view.buffer;
    }

    static async verify(plainText, signature, publicKey) {
        // console.warn(new Error("stack"))
        let plainBuffer = new PlatformTextEncoder("utf-8").encode(plainText);
        let result = await PlatformSubtleCrypto.verify(
            { name: "RSA-PSS", saltLength: 128 },
            publicKey,
            signature,
            plainBuffer
        );
        return result;
    }

    static async importSigningKeyJWK(jwk) {
        return PlatformSubtleCrypto.importKey(
            "jwk",
            jwk,
            { name: "RSA-PSS", hash: "SHA-256" },
            false,
            ["sign"]
        );
    }
    static async importPublicKeyJWK(jwk) {
        return PlatformSubtleCrypto.importKey(
            "jwk",
            jwk,
            { name: "RSA-PSS", hash: "SHA-256" },
            true,
            ["verify"]
        );
    }

    static async createJwk(bits) {
        if (!bits)
            throw new Error(
                "CryptoHelper.createJwk(bits): required arg missing (use 2048 or 4096)"
            );
        let key = await this.generateKey(bits);

        return await this.toJwk(key.publicKey);
    }

    static async toJwk(publicKey) {
        return await PlatformSubtleCrypto.exportKey("jwk", publicKey);
    }

    // static async importSigningKey(key) {
    //   return await subtle.importKey("jwk", key, {
    //     name: "RSA-PSS",
    //       hash: "SHA-256",
    //     publicExponent: new Uint8Array([1, 0, 1]),
    //     modulusLength: 2048,
    //   }, false, ["sign"])
    // }

    static async keyPrint(publicKey) {
        if (!publicKey) return null;

        let keyJwk = await this.toJwk(publicKey);
        if (!keyJwk) {
            console.warn("no jwk");
            return null;
        }
        let { e, kty, n } = keyJwk;
        if (!(e && kty && n)) {
            throw new Error("jwk doesn't have required entries");
        }

        let hash = await this.hash(JSON.stringify({ e, kty, n }));
        return hash.slice(0, 10);
    }

    static async generateKey(bits) {
        let key = await PlatformSubtleCrypto.generateKey(
            {
                name: "RSA-PSS",
                modulusLength: bits,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"]
        );
        return key;
    }
}
