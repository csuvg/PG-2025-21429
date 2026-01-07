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

export const handler = async () => {
  try {
    const db = (await connect()).db;
    const usersCollection = db.collection("users");
    const quizResultsAnalytics = await getQuizResultsAnalytics(db);

    // 1. Total number of students (users with role = "student")
    const totalStudents = await usersCollection.countDocuments({
      role: "student",
    });

    // 2. Students (role=student) with quizCompletedAt that is a date and not null
    const studentCompletedTests = await usersCollection.countDocuments({
      role: "student",
      quizCompletedAt: { $type: "date", $ne: null },
    });

    // 3. Count of students joined by month for current year, using created_at
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

    // Group count by month (1-12)
    const studentsJoinedByMonthAgg = await usersCollection
      .aggregate([
        {
          $match: {
            role: "student",
            created_at: { $gte: yearStart, $lt: yearEnd },
          },
        },
        {
          $group: {
            _id: { $month: "$created_at" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    // Turn aggregation result into an array [month: count] for all months (1-12)
    const joinedByMonth = Array(12)
      .fill(0)
      .reduce((acc, _, i) => {
        const found = studentsJoinedByMonthAgg.find((m) => m._id === i + 1);
        acc[i + 1] = found ? found.count : 0;
        return acc;
      }, {});

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalStudents,
        studentCompletedTests,
        studentsJoinedByMonth: joinedByMonth,
        quizResultsAnalytics,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error getting analytics: " + error.message,
      }),
    };
  }
};

const getQuizResultsAnalytics = async (db) => {
  const resultsCursor = db
    .collection("test_results")
    .find(
      { trait_scores: { $exists: true, $ne: null } },
      { projection: { trait_scores: 1 } }
    );

  const traitValues = {};

  const collectTraitScores = (node, prefix = "") => {
    if (!node || typeof node !== "object") {
      return;
    }

    Object.entries(node).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "number" && Number.isFinite(value)) {
        if (!traitValues[path]) {
          traitValues[path] = [];
        }

        traitValues[path].push(value);
        return;
      }

      if (value && typeof value === "object") {
        collectTraitScores(value, path);
      }
    });
  };

  await resultsCursor.forEach((doc) => {
    if (doc?.trait_scores) {
      collectTraitScores(doc.trait_scores);
    }
  });

  const analytics = {};

  const calculateMean = (values) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;

  const calculateMedian = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    return sorted[mid];
  };

  const calculateMode = (values) => {
    const counts = new Map();
    let maxCount = 0;

    values.forEach((value) => {
      const count = (counts.get(value) ?? 0) + 1;
      counts.set(value, count);
      maxCount = Math.max(maxCount, count);
    });

    const modes = [...counts.entries()]
      .filter(([, count]) => count === maxCount)
      .map(([value]) => value)
      .sort((a, b) => a - b);

    if (maxCount === 1) {
      return null;
    }

    return modes.length === 1 ? modes[0] : modes;
  };

  Object.entries(traitValues).forEach(([trait, values]) => {
    if (!values.length) {
      return;
    }

    analytics[trait] = {
      mean: calculateMean(values),
      median: calculateMedian(values),
      mode: calculateMode(values),
    };
  });

  return analytics;
};
