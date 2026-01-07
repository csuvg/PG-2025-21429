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
    const { faculty, duration, name } = event.queryStringParameters || {};

    const db = (await connect()).db;

    // Build MongoDB query based on filter parameters
    const query = {};

    if (faculty) {
      query.facultad = { $regex: faculty, $options: "i" };
    }

    if (duration) {
      query.duracion = parseInt(duration);
    }

    if (name) {
      query.nombre_carrera = { $regex: name, $options: "i" };
    }

    // Execute optimized query with projection
    let careers = await db
      .collection("careers")
      .find(query, {
        projection: {
          _id: 1,
          nombre_carrera: 1,
          facultad: 1,
          descripcion: 1,
          duracion: 1,
          empleabilidad: 1,
        },
      })
      .toArray();

    // Map to the required fields for response
    careers = careers.map((career) => ({
      _id: career._id,
      name: career.nombre_carrera,
      faculty: career.facultad,
      description: career.descripcion,
      duration: career.duracion,
      employability: career.empleabilidad,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        careers,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving careers: " + error.message,
      }),
    };
  }
};
