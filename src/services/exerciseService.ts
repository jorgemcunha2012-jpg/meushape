import type { ExerciseDBApiResponse, ExerciseDB } from "@/types/exercise";

const API_BASE_URL = "https://www.exercisedb.dev/api/v1";

export const searchExercises = async (
  query: string = "",
  limit: number = 10,
  offset: number = 0
): Promise<ExerciseDBApiResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/exercises/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error(`ExerciseDB API error: ${response.status}`);
  }
  return response.json();
};

export const fetchExerciseById = async (id: string): Promise<ExerciseDB> => {
  const response = await fetch(`${API_BASE_URL}/exercises/${id}`);
  if (!response.ok) {
    throw new Error(`ExerciseDB API error: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
};
