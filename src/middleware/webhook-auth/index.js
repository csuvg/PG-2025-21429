/* eslint-disable no-unused-vars */
import { verifyWebhook } from "@clerk/backend/webhooks";
import dotenv from "dotenv";

dotenv.config();

const webhookSecret = process.env.CLERK_SECRET_KEY;

if (!webhookSecret) {
  throw new Error("CLERK_SECRET_KEY is not set");
}

// Only checks svix-signature is present, otherwise denies, like @index.js pattern
export async function handler(event, _, callback) {
  try {
    console.log("Webhook authorizer event:", {
      hasSignature: !!event.headers["svix-signature"],
      methodArn: event.methodArn || event.routeArn,
    });

    const resource = event.methodArn || event.routeArn;

    if (event.headers && event.headers["svix-signature"]) {
      // Grant if svix-signature is present
      return callback(
        null,
        generatePolicy({ verified: true }, "webhook", "Allow", resource)
      );
    } else {
      // Deny if signature missing
      console.error("No svix-signature found in event headers");
      return callback(null, generatePolicy(null, "unknown", "Deny", resource));
    }
  } catch (err) {
    console.error("Webhook authorization failed:", err, {
      error: err.message,
      name: err.name,
      stack: err.stack,
    });
    return callback(
      null,
      generatePolicy(null, "unknown", "Deny", event.methodArn || event.routeArn)
    );
  }
}

// Format based on middleware/auth/index.js
function generatePolicy(metadata, principalId, effect, resource) {
  // Allow all methods/paths on this arn, like middleware/auth/index.js
  if (!resource) {
    console.error("Resource ARN is undefined");
    return {
      principalId: principalId || "unknown",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*",
          },
        ],
      },
    };
  }

  // Optionally expand wildcards similar to middleware/auth/index.js
  let wildcardResource = resource;
  try {
    // ARN: arn:aws:execute-api:region:account-id:api-id/stage/METHOD/path
    const arnParts = resource.split(":");
    const arnPrefix = arnParts.slice(0, 5).join(":");
    const apiGatewayPart = arnParts[5] || "";
    const pathParts = apiGatewayPart.split("/");
    const apiId = pathParts[0];
    const stage = pathParts[1] || "*";
    // Wildcard all methods/paths
    wildcardResource = `${arnPrefix}:${apiId}/${stage}/*/*`;
  } catch (e) {
    // fallback: use resource as-is
  }

  const policy = {
    principalId: principalId ?? "unknown",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: wildcardResource,
        },
      ],
    },
  };

  if (metadata) {
    policy.context = metadata;
  }

  console.log("Generated policy:", {
    effect,
    originalResource: resource,
    wildcardResource,
    principalId,
  });

  return policy;
}
