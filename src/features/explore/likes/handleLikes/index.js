import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

let conn = null;

const connect = async function () {
  if (conn == null) {
    conn = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    // `await`ing connection after assigning to the `conn` variable
    // to avoid multiple function calls creating new connections
    await conn.asPromise();
  }

  return conn;
};

// patch
export const handler = async (event, _) => {
  try {
    const db = (await connect()).db;

    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [userId]" }),
      };
    }

    const user = await db.collection("users").findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const { cardId } = event.pathParameters;
    const { action } = JSON.parse(event.body);

    const missingFields = [];

    if (!cardId) missingFields.push("cardId (path)");
    if (!action) missingFields.push("action (body)");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId cardId format",
        }),
      };
    }

    if (action !== "like" && action !== "unlike") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid action: " + action + ". Must be 'like' or 'unlike'",
        }),
      };
    }

    // Get the card and check if user has already liked it
    const card = await db
      .collection("cards")
      .findOne({ _id: new mongoose.Types.ObjectId(cardId) });
    if (!card) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Card not found" }),
      };
    }

    // Check current user likes to determine if they've already liked this card
    let userLikes = user?.likes ?? [];
    const hasAlreadyLiked = userLikes.some(
      (like) => like.cardId?.toString() === card._id?.toString()
    );

    // Handle like action
    if (action === "like") {
      if (hasAlreadyLiked) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Card already liked by user",
          }),
        };
      }

      // Add to user likes
      userLikes.push({
        cardId: card._id,
        title: card.title ?? card.display_data?.name ?? "Title not available",
        content:
          card.content ??
          card.display_data?.description ??
          "Content not available",
        type: card.type,
      });

      // Increment card likes count
      const newLikes = (card.likes || 0) + 1;
      await db
        .collection("cards")
        .updateOne(
          { _id: new mongoose.Types.ObjectId(cardId) },
          { $set: { likes: newLikes } }
        );
    }
    // Handle unlike action
    else if (action === "unlike") {
      if (!hasAlreadyLiked) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Card not liked by user",
          }),
        };
      }

      // Remove from user likes
      userLikes = userLikes.filter(
        (like) => like.cardId?.toString() !== card._id?.toString()
      );

      // Decrement card likes count (ensure it doesn't go below 0)
      const newLikes = Math.max((card.likes || 0) - 1, 0);
      await db
        .collection("cards")
        .updateOne(
          { _id: new mongoose.Types.ObjectId(cardId) },
          { $set: { likes: newLikes } }
        );
    }

    // Update user's likes array
    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(user._id) },
        { $set: { likes: userLikes } }
      );

    // register interaction
    const { insertedId } = await db.collection("interactions").insertOne({
      cardId,
      action,
      duration: 0,
      metadata: {},
      createdAt: new Date(),
      userId: user._id,
    });

    const interaction = await db
      .collection("interactions")
      .findOne({ _id: insertedId });

    const userInteractions = await db
      .collection("interactions")
      .find({ userId: user._id })
      .toArray();

    let tags = [];

    // update user tags each 7 interactions
    if (userInteractions.length % 7 === 0) {
      tags = await calculateTagScore(userId, tags);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Like action updated",
        interaction,
        updatedTags: tags,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating like action: " + error.message,
      }),
    };
  }
};

const calculateTagScore = async (userId, tagsData) => {
  let tags = tagsData;

  const db = (await connect()).db;

  const user = await db.collection("users").findOne({ clerk_id: userId });

  const userInteractions = await db
    .collection("interactions")
    .find({ userId: user._id })
    // get the last 7 interactions
    .sort({ createdAt: -1 })
    .limit(7)
    .toArray();
  // get all tags from all interactions, from the cards in the interactions
  const cards = await db
    .collection("cards")
    .find({
      _id: {
        $in: userInteractions.map(
          (interaction) => new mongoose.Types.ObjectId(interaction.cardId)
        ),
      },
    })
    .toArray();

  // Build tag objects including the corresponding interaction action
  // Map cardId to the action by finding the interaction for that card
  // Map cardId to all actions for that cardId, for each interaction (could be multiple per card)
  const interactionCardIdToActions = {};
  userInteractions.forEach((interaction) => {
    const cardIdStr = interaction.cardId?.toString();
    if (!interactionCardIdToActions[cardIdStr]) {
      interactionCardIdToActions[cardIdStr] = [];
    }
    interactionCardIdToActions[cardIdStr].push(interaction.action);
  });

  tags = [];
  cards.forEach((card) => {
    const cardIdStr = card._id?.toString();

    // display_data.tags
    if (Array.isArray(card?.display_data?.tags)) {
      card.display_data.tags.forEach((tag) => {
        if (typeof tag === "object" && tag) {
          tags.push({
            ...tag,
            actions: interactionCardIdToActions[cardIdStr] ?? [],
          });
        }
      });
    }
    // card.tags
    if (Array.isArray(card?.tags)) {
      card.tags.forEach((tag) => {
        if (typeof tag === "object" && tag) {
          tags.push({
            ...tag,
            actions: interactionCardIdToActions[cardIdStr] ?? [],
          });
        }
      });
    }
  });
  // Remove duplicate tag references (by stringifying tag+actions)
  tags = tags.filter(
    (tag, index, self) =>
      index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(tag))
  );

  const INTERACTION_WEIGHTS = {
    like: 0.3,
    unlike: -0.3,
    save: 0.5,
    unsave: -0.5,
  };

  // calculate score based on the weights
  tags = tags.map((tag) => ({
    ...tag,
    score: tag.actions.reduce(
      (acc, action) => acc + INTERACTION_WEIGHTS[action],
      0
    ), /// (tag.actions.length ?? 1) // average the scores if neeeded
  }));

  // update user tags with the new scores if the user already has the tag, and add it to the user user_tags doesnt contain already the tag
  let userTags = user.user_tags;

  // if the user has the tag, update the score, if not, add it to the user user_tags
  const updatedUserTags = tags.map((tag) => {
    if (userTags.some((t) => t.tag?.toString() === tag.id?.toString())) {
      let finalScore =
        userTags.find((t) => t.tag?.toString() === tag.id?.toString()).score +
        tag.score / 2;
      if (finalScore < 0) finalScore = 0.01;
      if (finalScore > 1) finalScore = 0.99;
      userTags = userTags.filter(
        (t) => t.tag?.toString() !== tag.id?.toString()
      );
      return {
        ...tag,
        score: finalScore,
      };
    }
    return tag;
  });

  const newUserTags = [...userTags, ...updatedUserTags];

  const formatedUserTags = newUserTags.map((tag) => ({
    tag: tag.id || tag.tag,
    name: tag.name,
    // limit the score to 3 decimal places
    score: parseFloat(tag.score.toFixed(3)),
  }));

  // update user user_tags
  await db
    .collection("users")
    .updateOne({ clerk_id: userId }, { $set: { user_tags: formatedUserTags } });

  return formatedUserTags;
};
