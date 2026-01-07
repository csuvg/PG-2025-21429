import mongoose from "mongoose";
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

export const CareerModel =
  mongoose.models.Career || mongoose.model("Career", CareerSchema);
