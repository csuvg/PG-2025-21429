import mongoose from "mongoose";
const { Schema, Types } = mongoose;

// Register Career schema BEFORE using it as a ref anywhere else
const CareerSchema = new Schema(
  {
    nombre_carrera: {
      type: String,
      required: true,
    },
    facultad: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    duracion: {
      type: Number,
      required: true,
    },
    empleabilidad: {
      type: String,
      required: true,
      enum: ["baja", "media", "alta"],
    },
    areas_de_desarrollo_potencial: [
      {
        area: {
          type: String,
          required: true,
        },
        descripcion: {
          type: String,
          required: true,
        },
      },
    ],
    plan_de_estudio: {
      type: Map,
      of: {
        primer_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
        segundo_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
      },
      required: true,
    },
    areas_de_formacion: [
      {
        area: {
          type: String,
          required: true,
        },
        descripcion: {
          type: String,
          default: "",
        },
      },
    ],
    perfil_del_egresado: {
      type: String,
      required: true,
    },
    competencias_desarrolladas: [
      {
        type: String,
      },
    ],
    salario_minimo: {
      type: Number,
      required: true,
    },
    salario_maximo: {
      type: Number,
      required: true,
    },
    moneda_salario: {
      type: String,
      required: true,
      default: "USD",
    },
    tags: [
      {
        tag: {
          type: Types.ObjectId,
          ref: "Tag",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const CareerModel =
  mongoose.models.Career || mongoose.model("Career", CareerSchema);

const AnswerSchema = new Schema({
  user_id: {
    type: Types.ObjectId,
    required: true,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const CommentSchema = new Schema({
  user_id: {
    type: Types.ObjectId,
    required: true,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
  answers: {
    type: [AnswerSchema],
    default: [],
  },
});

const ForumSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  creator_id: {
    type: Types.ObjectId,
    required: true,
    ref: "User",
  },
  career_id: {
    type: Types.ObjectId,
    required: true,
    ref: "Career",
  },
  comments: {
    type: [CommentSchema],
    default: [],
  },
  created_at: {
    type: Date,
    required: true,
  },
  final_date: {
    type: Date,
    required: true,
  },
});

export const ForumModel =
  mongoose.models.Forum || mongoose.model("Forum", ForumSchema);

const UserSchema = new mongoose.Schema({
  clerk_id: {
    type: String,
    required: true,
    unique: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "teacher", "director", "publisher", "student"],
    default: "student",
  },
  image_url: {
    type: String,
    required: false,
  },
  first_name: {
    type: String,
    required: false,
  },
  last_name: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
});

export const UserModel =
  mongoose.models.User || mongoose.model("User", UserSchema);
