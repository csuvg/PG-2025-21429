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

export const handler = async (event, _) => {
  try {
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [userId]" }),
      };
    }

    const db = (await connect()).db;

    const user = await db.collection("users").findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const { type, item_id } = JSON.parse(event.body);

    if (!type || !item_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required fields: [type, item_id]",
        }),
      };
    }

    // validate that the type is valid
    if (type !== "card" && type !== "career") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid type: " + type + ". Must be 'card' or 'career'",
        }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(item_id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId item_id format",
        }),
      };
    }

    // check if the item is already saved
    const savedItem = await db.collection("saveditems").findOne({
      user_id: user._id,
      item_id: new mongoose.Types.ObjectId(item_id),
    });
    if (savedItem) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Item already saved" }),
      };
    }

    // Find the item based on type
    let item;
    if (type === "card") {
      const card = await db
        .collection("cards")
        .findOne({ _id: new mongoose.Types.ObjectId(item_id) });
      if (!card) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Card not found" }),
        };
      }
      item = {
        _id: card._id,
        type: card.type,
        title: card.title,
        content: card.content,
        tags: card.tags,
        priority: card.priority,
        color: card.color,
        display_data: card.display_data,
      };
    } else {
      const career = await db
        .collection("careers")
        .findOne({ _id: new mongoose.Types.ObjectId(item_id) });
      if (!career) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Career not found" }),
        };
      }
      item = {
        _id: career._id,
        nombre_carrera: career.nombre_carrera,
        facultad: career.facultad,
        descripcion: career.descripcion,
        duration: career.duracion,
        employability: career.empleabilidad,
      };
    }

    // create the saved item in the saved_items collection
    const { insertedId: savedItemId } = await db
      .collection("saveditems")
      .insertOne({
        user_id: user._id,
        type,
        item_id: item._id,
        saved_at: new Date(),
        item,
      });

    // register interaction
    const { insertedId } = await db.collection("interactions").insertOne({
      cardId: item_id,
      action: "save",
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
      statusCode: 201,
      body: JSON.stringify({
        message: "Item saved successfully",
        item: {
          _id: savedItemId,
        },
        interaction,
        updatedTags: tags,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error saving item: " + error.message,
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
