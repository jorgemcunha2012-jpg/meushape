export interface ExerciseDB {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

export interface ExerciseDBApiResponse {
  success: boolean;
  metadata: {
    totalExercises: number;
    totalPages: number;
    currentPage: number;
    previousPage: string | null;
    nextPage: string | null;
  };
  data: ExerciseDB[];
}
