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
    const careerId = event.pathParameters?.id;

    if (!careerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Career id is required in the path. /careers/{id}",
        }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(careerId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId career ID format",
        }),
      };
    }

    const db = (await connect()).db;

    const career = await db
      .collection("careers")
      .findOne({ _id: new mongoose.Types.ObjectId(careerId) });

    if (!career) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Career not found",
        }),
      };
    }

    // Extract all courses from plan_de_estudio
    let courses = [];
    if (career.plan_de_estudio) {
      Object.keys(career.plan_de_estudio).forEach((yearKey) => {
        const year = career.plan_de_estudio[yearKey];
        if (year.primer_semestre && Array.isArray(year.primer_semestre)) {
          courses.push(...year.primer_semestre);
        }
        if (year.segundo_semestre && Array.isArray(year.segundo_semestre)) {
          courses.push(...year.segundo_semestre);
        }
      });
    }

    // get all needed courses from courses collection
    courses = await db
      .collection("courses")
      .find({ _id: { $in: courses.map((course) => course.id) } })
      .toArray();

    /*
        "courses": [
        {
            "_id": "68df5ddf3309b8126b3f9cbd",
            "nombre": "Algoritmos y Programacion Basica",
            "prerequisitos": [
                "68df5ddf3309b8126b3f9d23",
                "68df5ddf3309b8126b3f9d2c",
                "68df5ddf3309b8126b3f9d67",
                "68df5ddf3309b8126b3f9e5a",
                "68df5ddf3309b8126b3f9e83",
                "68df5ddf3309b8126b3f9f0b",
                "68df5ddf3309b8126b3f9f0b",
                "68df5ddf3309b8126b3f9f47"
            ]
        },
        {
            "_id": "68df5ddf3309b8126b3f9ce6",
            "nombre": "Arquitectura de Computadores",
            "prerequisitos": [
                "68df5ddf3309b8126b3f9d9e",
                "68df5ddf3309b8126b3f9db0",
                "68df5ddf3309b8126b3f9e62",
                "68df5ddf3309b8126b3f9e69",
                "68df5ddf3309b8126b3f9f23",
                "68df5ddf3309b8126b3f9fbf"
            ]
        },
        ...,
  ]
    */

    const pensum = getPensum(career, courses);

    return {
      statusCode: 200,
      body: JSON.stringify({
        career,
        pensum,
        courses,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving career: " + error.message,
      }),
    };
  }
};

const getPensum = (career, courses) => {
  const pensum = [];
  // Determine how many years the pensum actually has by inspecting plan_de_estudio keys
  const availableYears = Object.keys(career.plan_de_estudio).filter((key) =>
    key.startsWith("año_")
  );
  // Support up to 5 years, but only include the years that exist (i.e. for 4-year pensums)
  // Sort keys to enforce numeric order
  const years = availableYears.sort((a, b) => {
    // Extract numbers and compare
    const numA = parseInt(a.replace("año_", ""), 10);
    const numB = parseInt(b.replace("año_", ""), 10);
    return numA - numB;
  });

  years.forEach((year, i) => {
    pensum.push({
      year: i + 1,
      first_semester: career.plan_de_estudio[year]?.primer_semestre.map(
        (course) => {
          const currentCourse = courses.find(
            (c) => c._id.toString() === course.id.toString()
          );
          return {
            ...currentCourse,
            prerequisitos: currentCourse?.prerequisitos?.map((prerequisiteId) =>
              courses.find(
                (c) => c._id.toString() === prerequisiteId.toString()
              )
            ),
          };
        }
      ),
      second_semester: career.plan_de_estudio[year]?.segundo_semestre.map(
        (course) => {
          const currentCourse = courses.find(
            (c) => c._id.toString() === course.id.toString()
          );
          return {
            ...currentCourse,
            prerequisitos: currentCourse?.prerequisitos?.map((prerequisiteId) =>
              courses.find(
                (c) => c._id.toString() === prerequisiteId.toString()
              )
            ),
          };
        }
      ),
    });
  });

  return pensum;

  // pensum.push({
  //   year: 1,
  //   first_semester: career.plan_de_estudio.año_1.primer_semestre.map((course) => {
  //     const currentCourse = courses.find((c) => c._id.toString() === course.id.toString())
  //     return {
  //       ...currentCourse,
  //       prerequisites: currentCourse?.prerequisitos?.map((prerequisiteId) => courses.find((c) => c._id.toString() === prerequisiteId.toString())),
  //     }
  //   }),
  //   second_semester: career.plan_de_estudio.año_1.segundo_semestre.map((course) => {
  //     const currentCourse = courses.find((c) => c._id.toString() === course.id.toString())
  //     return {
  //       ...currentCourse,
  //       prerequisites: currentCourse?.prerequisitos?.map((prerequisiteId) => courses.find((c) => c._id.toString() === prerequisiteId.toString())),
  //     }
  //   }),
  // })
};
