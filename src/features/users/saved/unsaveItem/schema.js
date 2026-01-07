import mongoose from "mongoose";

const CardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["career", "what_if", "question", "testimony"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
    required: false,
  },
  priority: {
    type: Number,
    required: false,
  },
  created_at: {
    type: Date,
    required: true,
  },
  color: {
    type: String,
    required: false,
  },
  display_data: {
    type: Object,
    required: false,
  },
});

export const CardModel = mongoose.model("Card", CardSchema);

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
    enum: ["admin", "teacher", "director", "student"],
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

export const UserModel = mongoose.model("User", UserSchema);

const { Schema, Types } = mongoose;

// Course schema for plan_de_estudio (embedded, not referenced)
const EmbeddedCourseSchema = new Schema(
  {
    id: {
      type: Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Standalone Course model (for other uses, if needed)
const CourseSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  prerequisitos: [
    {
      type: Types.ObjectId,
      ref: "Course",
      required: true,
      default: [],
    },
  ],
});
export const CourseModel =
  mongoose.models.Course || mongoose.model("Course", CourseSchema);

// Tag model
const TagSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: false,
  }
);
export const TagModel = mongoose.models.Tag || mongoose.model("Tag", TagSchema);

// Embedded tag for Career
const EmbeddedTagSchema = new Schema(
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
  {
    _id: true,
    timestamps: false,
  }
);

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
      enum: ["baja", "media", "alta", "muy alta"],
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
      año_1: {
        primer_semestre: [EmbeddedCourseSchema],
        segundo_semestre: [EmbeddedCourseSchema],
      },
      año_2: {
        primer_semestre: [EmbeddedCourseSchema],
        segundo_semestre: [EmbeddedCourseSchema],
      },
      año_3: {
        primer_semestre: [EmbeddedCourseSchema],
        segundo_semestre: [EmbeddedCourseSchema],
      },
      año_4: {
        primer_semestre: [EmbeddedCourseSchema],
        segundo_semestre: [EmbeddedCourseSchema],
      },
      año_5: {
        primer_semestre: [EmbeddedCourseSchema],
        segundo_semestre: [EmbeddedCourseSchema],
      },
    },
    areas_de_formacion: [
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
    perfil_del_egresado: {
      type: String,
      required: true,
    },
    competencias_desarrolladas: [
      {
        type: String,
        required: true,
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
    tags: [EmbeddedTagSchema],
    insights: {
      type: Object,
      required: false,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const CareerModel = mongoose.model("Career", CareerSchema);

// Schema for a saved item, with user id, item id (can be a career or card), type, timestamp, and full item data (denormalized)
const SavedItemSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    ref: "User",
  },
  type: {
    type: String,
    required: true,
    enum: ["career", "card"], // Indicates the kind of item saved
  },
  // item_id can refer to either a career _id or card _id; use ObjectId to generalize
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Relation: Not referenced directly since we store denormalized data; consumers will need to know type to query original
  },
  saved_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
  item: {
    type: Object,
    required: true,
    // This stores the full item object (career or card), denormalized at time of save
  },
});

export const SavedItemModel =
  mongoose.models.SavedItem || mongoose.model("SavedItem", SavedItemSchema);
