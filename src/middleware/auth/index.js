// @ts-nocheck
import jwt from "jsonwebtoken";

const publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, "\n");

export async function handler(event, context, callback) {
  try {
    // Log the incoming authorization token (masked for security)
    console.log("Authorization attempt:", {
      hasToken: !!event.authorizationToken,
      tokenPrefix: event.authorizationToken
        ? event.authorizationToken.substring(0, 10) + "..."
        : "none",
      methodArn: event.methodArn,
    });

    // Check if authorizationToken exists
    if (!event.authorizationToken) {
      console.error("Missing authorizationToken in event");
      return callback(
        null,
        generatePolicy(null, "unknown", "Deny", event.methodArn)
      );
    }

    // Extract the token from the Authorization header
    const tokenParts = event.authorizationToken.split(" ");

    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      console.error(
        "Invalid token format. Expected 'Bearer <token>', got:",
        tokenParts[0]
      );
      return callback(
        null,
        generatePolicy(null, "unknown", "Deny", event.methodArn)
      );
    }

    const token = tokenParts[1];

    if (!token) {
      console.error("Token is empty after extraction");
      return callback(
        null,
        generatePolicy(null, "unknown", "Deny", event.methodArn)
      );
    }

    // Verifies and decodes the JWT with clock tolerance
    const claims = jwt.verify(token, publicKey, {
      clockTolerance: 10, // Allow 10 seconds of clock skew
    });
    console.log("claims:", claims);

    // Attach the user id from Clerk into the metadata
    // We'll ensure metadata exists and add user_id to it
    const metadata = {
      user_id: claims.sub || claims.user_id,
    };

    console.log(
      "Authorization successful for user:",
      claims.sub,
      claims?.first_name
    );

    // If the token is valid, the user is authorized
    callback(
      null,
      generatePolicy(metadata, claims.sub, "Allow", event.methodArn)
    );
  } catch (err) {
    // Log the specific error for debugging
    console.error("Authorization failed:", err, {
      error: err.message,
      name: err.name,
      stack: err.stack,
    });

    // If verification fails, deny access
    callback(null, generatePolicy(null, "unknown", "Deny", event.methodArn));
  }
}

function generatePolicy(metadata, principalId, effect, resource) {
  // Use wildcard resource to allow access to all endpoints in the API
  // This prevents caching issues when switching between different endpoints
  // Format: arn:aws:execute-api:region:account-id:api-id/stage/*/*

  // Extract ARN parts: arn:aws:execute-api:region:account-id:api-id/stage/METHOD/path
  const arnParts = resource.split(":");
  // First 5 parts: arn:aws:execute-api:region:account-id
  const arnPrefix = arnParts.slice(0, 5).join(":");

  // Last part contains: api-id/stage/METHOD/path
  const apiGatewayPart = arnParts[5] || "";
  const pathParts = apiGatewayPart.split("/");

  // Extract api-id and stage
  const apiId = pathParts[0];
  const stage = pathParts[1] || "*";

  // Create wildcard for all methods and paths in this stage
  const wildcardResource = `${arnPrefix}:${apiId}/${stage}/*/*`;

  const authResponse = {
    principalId: principalId,
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
    authResponse.context = metadata;
  }

  console.log("Generated policy:", {
    effect,
    originalResource: resource,
    wildcardResource,
    principalId,
    stage,
  });

  return authResponse;
}
