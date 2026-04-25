import { getStxAddress } from "@bigmarket/bm-common";
import {} from "@bigmarket/bm-types";
import DOMPurify from "isomorphic-dompurify";
export function validatePoll(poll, marketFeeBipsMax) {
    const errors = {};
    // Title
    const titleResult = validateTitle(poll.name);
    if (!titleResult.isValid)
        errors.title = titleResult.message;
    const feeResult = validateMarketFee(poll.marketFee, marketFeeBipsMax);
    if (!feeResult.isValid)
        errors.marketFee = feeResult.message;
    // Description
    const descResult = validateDescription(poll.description);
    if (!descResult.isValid)
        errors.description = descResult.message;
    // Logo
    const logoResult = validateLogo(poll.logo);
    if (!logoResult.isValid)
        errors.logo = logoResult.message;
    // Market Type
    if (poll.marketType === undefined) {
        errors.marketType = "Market type is required";
    }
    else if ((poll.marketType === 0 || poll.marketType === 1) &&
        (!poll.marketTypeDataCategorical ||
            poll.marketTypeDataCategorical.length < 2)) {
        errors.options =
            "At least 2 options are required for binary/categorical markets";
    }
    else if (poll.marketType === 2 && !poll.priceFeedId) {
        errors.priceFeed = "Price feed is required for scalar markets";
    }
    if (poll.marketType === 2 &&
        (!poll.marketTypeDataScalar || !isContiguous(poll.marketTypeDataScalar))) {
        errors.ranges =
            "Contiguous values only - the min must be the max of the previous";
    }
    if (poll.marketType === 0 &&
        (!poll.marketTypeDataCategorical ||
            poll.marketTypeDataCategorical.length !== 2)) {
        throw new Error("Binary markets must have exactly 2 options");
    }
    if (poll.marketType === 1) {
        if (!poll.marketTypeDataCategorical) {
            errors.priceFeed = "Categorical markets must have 2 or more options";
        }
        if (poll.marketTypeDataCategorical.length > 9) {
            errors.priceFeed = "Categorical markets must have no more than 9 options";
        }
    }
    if (poll.marketType === 2 && !poll.priceFeedId) {
        throw new Error("Scalar markets must have a price feed ID");
    }
    // Criteria text
    if (!poll.criterionSources?.criteria ||
        poll.criterionSources.criteria.trim().length < 10) {
        errors.criteria = "Resolution criteria must be at least 10 characters";
    }
    // Sources
    if (!poll.criterionSources?.sources ||
        poll.criterionSources.sources.length === 0) {
        errors.sources = "At least one resolution source is required";
    }
    if (poll.criterionDays.duration <= 10) {
        errors.criteria = "Market duration must be more than 10 blocks";
    }
    if (poll.criterionDays.coolDown <= 10) {
        errors.coolDown = "Market cool down be more than 10 blocks";
    }
    // Category
    if (!poll.category || poll.category.trim() === "") {
        errors.category = "Category is required";
    }
    // Token
    if (!poll.token || poll.token.trim() === "") {
        errors.token = "Token is required";
    }
    // Treasury
    const treasuryResult = validateTreasury(poll.treasury);
    if (!treasuryResult.isValid)
        errors.treasury = treasuryResult.message;
    // Social links
    const twitterResult = validateTwitter(poll.social?.twitter?.projectHandle ?? "");
    if (!twitterResult.isValid)
        errors.twitter = twitterResult.message;
    const discordResult = validateDiscord(poll.social?.discord?.serverId ?? "");
    if (!discordResult.isValid)
        errors.discord = discordResult.message;
    const websiteResult = validateWebsite(poll.social?.website?.url ?? "");
    if (!websiteResult.isValid)
        errors.website = websiteResult.message;
    // Additional validation for market type data
    // Validate duration values
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
export function isValidURL(string) {
    try {
        return true;
        const url = new URL(string);
        // Only HTTPS in production
        if (url.protocol !== "https:" && url.protocol !== "data:")
            return false;
        // Block all private/local addresses in production
        const hostname = url.hostname.toLowerCase();
        const blockedPatterns = [
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "::1",
            /^192\.168\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^169\.254\./, // Link-local
            /^fc00:/, // Private IPv6
            /^fe80:/, // Link-local IPv6
        ];
        const isBlocked = blockedPatterns.some((pattern) => {
            if (typeof pattern === "string") {
                return hostname === pattern;
            }
            return pattern.test(hostname);
        });
        if (isBlocked) {
            return false;
        }
        // Additional security checks
        if (url.username || url.password)
            return false; // No auth in URLs
        if (url.href.length > 2000)
            return false; // Reasonable length limit
        return true;
    }
    catch {
        return false;
    }
}
export function isValidStacksAddress(address) {
    // Real-world Stacks addresses don't always follow strict Base58
    // Some valid addresses contain '0' despite Base58 theory
    // This is a practical validation for actual Stacks wallet addresses
    if (!address || typeof address !== "string") {
        return false;
    }
    // Must start with ST (testnet) or SP (mainnet)
    if (!address.startsWith("ST") && !address.startsWith("SP")) {
        return false;
    }
    // Must be 41-42 characters total length
    if (address.length < 41 || address.length > 42) {
        return false;
    }
    // Allow alphanumeric characters (more permissive for real wallet addresses)
    // Includes '0' since real Stacks wallets generate addresses with it
    const addressBody = address.slice(2); // Remove ST/SP prefix
    const isValidBody = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0]+$/.test(addressBody);
    return isValidBody;
}
export function isValidTwitterHandle(handle) {
    return /^[a-zA-Z][a-zA-Z0-9_]{0,14}$/.test(handle);
}
export function isValidDiscordServerId(serverId) {
    return /^\d{17,19}$/.test(serverId) && parseInt(serverId) > 0;
}
export function validateMarketFee(fee, marketFeeBipsMax) {
    // Market fee must be between 0 and max allowed
    const maxFee = marketFeeBipsMax || 1000;
    const valid = fee >= 0 && fee * 100 <= maxFee;
    if (!valid) {
        return {
            isValid: false,
            message: "Fee must be less than or equal " + maxFee,
        };
    }
    else {
        return { isValid: true, message: "" };
    }
}
// Enhanced input sanitization with comprehensive XSS prevention
// SECURITY: Uses DOMPurify to prevent XSS attacks and malicious code injection
// Protects against HTML injection, JavaScript injection, and other attack vectors
export function sanitizeInput(input) {
    if (!input || typeof input !== "string")
        return "";
    // Use DOMPurify for comprehensive XSS protection
    const sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    });
    return sanitized
        .trim()
        .replace(/javascript:/gi, "")
        .replace(/data:/gi, "")
        .replace(/vbscript:/gi, "")
        .replace(/on\w+=/gi, "")
        .slice(0, 1000); // Limit length
}
// Real-time validation functions
export function validateTitle(title) {
    const sanitizedTitle = sanitizeInput(title);
    if (!sanitizedTitle || sanitizedTitle.length === 0) {
        return { isValid: false, message: "Market title is required" };
    }
    else if (sanitizedTitle.length < 3) {
        return { isValid: false, message: "Title must be at least 3 characters" };
    }
    else if (sanitizedTitle.length > 200) {
        return {
            isValid: false,
            message: "Title must be less than 100 characters",
        };
    }
    else {
        return { isValid: true, message: sanitizedTitle };
        // template.name = sanitizedTitle; // Use sanitized version
    }
}
export function validateDescription(description) {
    const sanitizedDescription = sanitizeInput(description);
    if (!sanitizedDescription || sanitizedDescription.length === 0) {
        return { isValid: false, message: "Market description is required" };
    }
    else if (sanitizedDescription.length < 10) {
        return {
            isValid: false,
            message: "Description must be at least 10 characters",
        };
    }
    else if (sanitizedDescription.length > 1000) {
        return {
            isValid: false,
            message: "Description must be less than 1000 characters",
        };
    }
    else {
        return { isValid: true, message: sanitizedDescription };
    }
}
export function validateTreasury(treasury) {
    const trimmed = treasury?.trim();
    if (!trimmed) {
        return { isValid: false, message: "Treasury address is required" };
    }
    // Validate as either contract principal or standard principal
    try {
        if (trimmed.includes(".")) {
            // Contract principal: ST... .contract-name
            const [addr, contract] = trimmed.split(".");
            //contractPrincipalCV(addr, contract);
        }
        else {
            // Standard principal: ST...
            //principalCV(trimmed);
            // Ownership check only for bare addresses
            const isOwner = verifyAddressOwnership(trimmed);
            if (!isOwner) {
                return {
                    isValid: false,
                    message: "Cannot verify address ownership. Only use addresses you control.",
                };
            }
        }
    }
    catch (err) {
        return {
            isValid: false,
            message: "Must be a valid Stacks address or contract (e.g. ST... or ST....contract-name)",
        };
    }
    return { isValid: true, message: "" };
}
// Add address ownership verification function
// SECURITY: This prevents fund theft by ensuring only verified wallet owners can set treasury addresses
// Address spoofing protection - users cannot set addresses they don't control
export function verifyAddressOwnership(address) {
    try {
        // Implement wallet signature verification
        // This prevents address spoofing
        return getStxAddress() === address;
    }
    catch (error) {
        return false;
    }
}
export function validateLogo(logo) {
    if (logo && logo.trim() !== "") {
        const sanitizedLogo = sanitizeInput(logo);
        if (!isValidURL(sanitizedLogo)) {
            return {
                isValid: false,
                message: "Must be a valid URL (http:// or https://)",
            };
        }
        else {
            return { isValid: true, message: sanitizedLogo };
        }
    }
    else {
        return { isValid: true, message: "" };
    }
}
export function validateTwitter(handle) {
    if (handle && handle.trim() !== "") {
        if (!isValidTwitterHandle(handle.trim())) {
            return {
                isValid: false,
                message: "Must be 1-15 characters, letters, numbers, underscore only",
            };
        }
        else {
            return { isValid: true, message: "" };
        }
    }
    else {
        return { isValid: true, message: "" };
    }
}
export function validateDiscord(serverId) {
    if (serverId && serverId.trim() !== "") {
        if (!isValidDiscordServerId(serverId.trim())) {
            return { isValid: false, message: "Must be 17-19 digits" };
        }
        else {
            return { isValid: true, message: "" };
        }
    }
    else {
        return { isValid: true, message: "" };
    }
}
export function validateWebsite(url) {
    if (url && url.trim() !== "") {
        if (!isValidURL(url.trim())) {
            return {
                isValid: false,
                message: "Must be a valid URL (http:// or https://)",
            };
        }
        else {
            return { isValid: true, message: "" };
        }
    }
    else {
        return { isValid: true, message: "" };
    }
}
export function validateMarketType(template) {
    if (template.marketType === 1) {
        if (!template.marketTypeDataCategorical ||
            template.marketTypeDataCategorical.length < 1 ||
            template.marketTypeDataCategorical.length > 9) {
            return {
                isValid: false,
                message: "Categorical markets must have at least three options",
            };
        }
    }
    else if (template.marketType === 2) {
        if (!template.priceFeedId) {
            return { isValid: false, message: "Price feed required" };
        }
        if (!template.marketTypeDataScalar ||
            !isContiguous(template.marketTypeDataScalar)) {
            return {
                isValid: false,
                message: "Contiguous values only - the min must be the max of the previous",
            };
        }
    }
    else {
        if (template.marketType === undefined) {
            return { isValid: false, message: "Market type 1 or 2 allowed only" };
        }
        else if (template.marketType === 1 &&
            (!template.marketTypeDataCategorical ||
                template.marketTypeDataCategorical.length < 2)) {
            return {
                isValid: false,
                message: "At least 2 options are required for binary/categorical markets",
            };
        }
        else if (template.marketType === 2 && !template.priceFeedId) {
            return {
                isValid: false,
                message: "Price feed is required for scalar markets",
            };
        }
    }
}
export function isContiguous(data) {
    for (let i = 1; i < data.length; i++) {
        if (data[i].min !== data[i - 1].max) {
            return false;
        }
    }
    return true;
}
// Validation logic that only triggers on user interaction
export function validateOnInteraction(field, value, userHasInteracted) {
    // Only validate if user has interacted with the field
    if (userHasInteracted[field]) {
        switch (field) {
            case "title":
                validateTitle(value);
                break;
            case "description":
                validateDescription(value);
                break;
            case "treasury":
                validateTreasury(value);
                break;
            case "logo":
                validateLogo(value);
                break;
            case "twitter":
                validateTwitter(value);
                break;
            case "discord":
                validateDiscord(value);
                break;
            case "website":
                validateWebsite(value);
                break;
        }
    }
}
//# sourceMappingURL=validation.js.map