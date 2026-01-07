import mongoose from "mongoose";
const { Schema, Types } = mongoose;

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

export const CareerModel = mongoose.model("Career", CareerSchema);
